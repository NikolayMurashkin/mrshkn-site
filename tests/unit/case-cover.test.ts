import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { composeCaseCover } from '../../scripts/case-cover/compose';
import { CASE_COVER_LAYOUT } from '../../scripts/case-cover/consts';

/**
 * Обложка кейса — коллаж «ноутбук + телефон» того же размера, что обложка засева: 1600×1000. Снимки страницы
 * рисует sharp сплошной заливкой → по цвету пикселя видно, какой снимок лег на экран.
 */

const ROOT = join(import.meta.dirname, '../..');

const COVER = { width: 1600, height: 1000 };

const RED = [255, 0, 0] as const;
const GREEN = [0, 255, 0] as const;

/** Допуск на канал: сжатие и сглаживание краев сдвигают цвет. */
const TOLERANCE = 8;

type Rgb = readonly [number, number, number];

type Rect = { x: number; y: number; width: number; height: number };

let dir: string;
let desktop: string;
let mobile: string;

const solid = (path: string, width: number, height: number, background: string) =>
  sharp({ create: { width, height, channels: 3, background } })
    .png()
    .toFile(path);

const center = ({ x, y, width, height }: Rect) => ({ x: Math.floor(x + width / 2), y: Math.floor(y + height / 2) });

const pixelAt = async (path: string, x: number, y: number): Promise<Rgb> => {
  const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
  const offset = (y * info.width + x) * info.channels;

  return [data[offset], data[offset + 1], data[offset + 2]];
};

const isColor = (pixel: Rgb, color: Rgb) =>
  pixel.every((channel, index) => Math.abs(channel - color[index]) <= TOLERANCE);

/** Каждый вызов — отдельный процесс yarn и node: дольше пяти секунд по умолчанию у Vitest. */
const CLI_TIMEOUT = 30_000;

const runCli = (args: string[]) =>
  spawnSync('yarn', ['case:cover', ...args], { cwd: ROOT, encoding: 'utf8', timeout: CLI_TIMEOUT });

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'case-cover-'));
  desktop = join(dir, 'desktop.png');
  mobile = join(dir, 'mobile.png');

  await solid(desktop, 1440, 900, '#ff0000');
  await solid(mobile, 390, 844, '#00ff00');
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('обложка кейса: composeCaseCover', () => {
  it('из двух PNG — PNG 1600×1000, на экране ноутбука снимок 1440, на экране телефона снимок 390', async () => {
    const out = join(dir, 'cover.png');

    await composeCaseCover(desktop, mobile, out);

    const { format, width, height } = await sharp(out).metadata();
    const laptop = center(CASE_COVER_LAYOUT.laptop);
    const phone = center(CASE_COVER_LAYOUT.phone);

    expect({ format, width, height }).toEqual({ format: 'png', ...COVER });
    expect(
      isColor(await pixelAt(out, laptop.x, laptop.y), RED),
      `пиксель экрана ноутбука ${laptop.x},${laptop.y}`,
    ).toBe(true);
    expect(isColor(await pixelAt(out, phone.x, phone.y), GREEN), `пиксель экрана телефона ${phone.x},${phone.y}`).toBe(
      true,
    );

    const corner = await pixelAt(out, 4, 4);

    expect(isColor(corner, RED) || isColor(corner, GREEN), `угол 4,4 — фон шаблона, а не снимок: ${corner}`).toBe(
      false,
    );
  });

  it('длинный снимок кадрируется сверху: на экране ноутбука начало страницы, а не вся страница', async () => {
    const tall = join(dir, 'tall.png');
    const out = join(dir, 'cover-tall.png');

    await sharp({ create: { width: 1440, height: 5000, channels: 3, background: '#0000ff' } })
      .composite([
        {
          input: { create: { width: 1440, height: 1500, channels: 3, background: '#ff0000' } },
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toFile(tall);

    await composeCaseCover(tall, mobile, out);

    const { width, height } = await sharp(out).metadata();
    const laptop = center(CASE_COVER_LAYOUT.laptop);

    expect({ width, height }).toEqual(COVER);
    expect(
      isColor(await pixelAt(out, laptop.x, laptop.y), RED),
      `пиксель экрана ноутбука ${laptop.x},${laptop.y}`,
    ).toBe(true);
  });
});

describe('обложка кейса: yarn case:cover', { timeout: CLI_TIMEOUT }, () => {
  it('из двух PNG — код 0 и файл 1600×1000', async () => {
    const out = join(dir, 'cli-cover.png');

    const { status, stderr } = runCli([desktop, mobile, out]);

    expect(status, stderr).toBe(0);

    const { width, height } = await sharp(out).metadata();

    expect({ width, height }).toEqual(COVER);
  });

  it('вход не найден — код не 0, в stderr путь, файла нет', () => {
    const missing = join(dir, 'net-takogo-snimka.png');
    const out = join(dir, 'cli-missing.png');

    const { status, stderr } = runCli([missing, mobile, out]);

    expect(status).not.toBe(0);
    expect(stderr).toContain(missing);
    expect(existsSync(out)).toBe(false);
  });

  it('вход не PNG — код не 0, в stderr «PNG», файла нет', async () => {
    const jpeg = join(dir, 'desktop.jpg');
    const out = join(dir, 'cli-jpeg.png');

    await sharp({ create: { width: 1440, height: 900, channels: 3, background: '#ff0000' } })
      .jpeg()
      .toFile(jpeg);

    const { status, stderr } = runCli([jpeg, mobile, out]);

    expect(status).not.toBe(0);
    expect(stderr).toContain('PNG');
    expect(existsSync(out)).toBe(false);
  });

  it('второй вход (снимок 390) не PNG — код не 0, в stderr «PNG» и его путь, файла нет', async () => {
    const jpeg = join(dir, 'mobile.jpg');
    const out = join(dir, 'cli-mobile-jpeg.png');

    await sharp({ create: { width: 390, height: 844, channels: 3, background: '#00ff00' } })
      .jpeg()
      .toFile(jpeg);

    const { status, stderr } = runCli([desktop, jpeg, out]);

    expect(status).not.toBe(0);
    expect(stderr).toContain('PNG');
    expect(stderr).toContain(jpeg);
    expect(existsSync(out)).toBe(false);
  });

  it('два аргумента вместо трех — код не 0, в stderr подсказка с case:cover', () => {
    const { status, stderr } = runCli([desktop, mobile]);

    expect(status).not.toBe(0);
    expect(stderr).toContain('case:cover');
  });
});
