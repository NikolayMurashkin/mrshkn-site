import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** `/favicon.ico` просят браузеры и поисковики без всякой ссылки — без файла адрес отдает 404. */
const FAVICON_PATH = join(import.meta.dirname, '../../src/app/favicon.ico');

const HEADER_SIZE = 6;

const ENTRY_SIZE = 16;

type IconEntry = { width: number; height: number; size: number; offset: number };

/** Заголовок ICO и записи каталога; байт размера 0 означает 256 px. */
const readIcon = () => {
  expect(existsSync(FAVICON_PATH), 'src/app/favicon.ico есть').toBe(true);

  const file = readFileSync(FAVICON_PATH);
  const count = file.readUInt16LE(4);
  const entries: IconEntry[] = Array.from({ length: count }, (_, index) => {
    const start = HEADER_SIZE + index * ENTRY_SIZE;

    return {
      width: file.readUInt8(start) || 256,
      height: file.readUInt8(start + 1) || 256,
      size: file.readUInt32LE(start + 8),
      offset: file.readUInt32LE(start + 12),
    };
  });

  return { file, reserved: file.readUInt16LE(0), type: file.readUInt16LE(2), count, entries };
};

describe('src/app/favicon.ico', () => {
  it('3.1: файл есть, заголовок ICO — иконка не меньше чем из трех изображений', () => {
    const icon = readIcon();

    expect(icon.reserved).toBe(0);
    expect(icon.type).toBe(1);
    expect(icon.count).toBeGreaterThanOrEqual(3);
  });

  it('3.2: изображения 16, 32 и 48 px, все квадратные', () => {
    const { entries } = readIcon();

    for (const entry of entries) {
      expect(entry.width, `запись ${entry.width}×${entry.height}`).toBe(entry.height);
    }

    expect(entries.map(({ width }) => width)).toEqual(expect.arrayContaining([16, 32, 48]));
  });

  it('3.3: данные каждого изображения непустые и целиком лежат в файле', () => {
    const { file, entries } = readIcon();

    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(entry.size, `размер изображения ${entry.width} px`).toBeGreaterThan(0);
      expect(entry.offset + entry.size, `конец изображения ${entry.width} px`).toBeLessThanOrEqual(file.length);
    }
  });
});
