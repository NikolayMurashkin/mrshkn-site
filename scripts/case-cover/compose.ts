import { access } from 'node:fs/promises';
import sharp from 'sharp';
import { CASE_COVER_COLORS, CASE_COVER_LAYOUT, COVER_SHADOW, LAPTOP_FRAME, PHONE_FRAME } from './consts.ts';
import type { CaseCoverInputProblem, Rect } from './types.ts';

const { width, height, laptop, phone } = CASE_COVER_LAYOUT;

const laptopBody = (): Rect => ({
  x: laptop.x - LAPTOP_FRAME.bezel,
  y: laptop.y - LAPTOP_FRAME.bezel,
  width: laptop.width + LAPTOP_FRAME.bezel * 2,
  height: laptop.height + LAPTOP_FRAME.bezel + LAPTOP_FRAME.chin,
});

const laptopBase = (): Rect => {
  const body = laptopBody();

  return {
    x: body.x - LAPTOP_FRAME.baseOverhang,
    y: body.y + body.height,
    width: body.width + LAPTOP_FRAME.baseOverhang * 2,
    height: LAPTOP_FRAME.baseHeight,
  };
};

const phoneBody = (): Rect => ({
  x: phone.x - PHONE_FRAME.bezel,
  y: phone.y - PHONE_FRAME.bezel,
  width: phone.width + PHONE_FRAME.bezel * 2,
  height: phone.height + PHONE_FRAME.bezel * 2,
});

const rect = ({ x, y, width: w, height: h }: Rect, radius: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" ${extra}/>`;

const svg = (body: string, size: { width: number; height: number } = { width, height }) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}">${body}</svg>`);

/** Размытие тени на весь холст: у фильтра по умолчанию область в 10% от фигуры, и тень плоской подставки обрезалась. */
const blurFilter = `<defs><filter id="blur" filterUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><feGaussianBlur stdDeviation="${COVER_SHADOW.blur}"/></filter></defs>`;

/** Фон, тени и корпус ноутбука с подставкой: слой под снимком 1440. */
const laptopLayer = () => {
  const body = laptopBody();
  const base = laptopBase();
  const { background, body: bodyColor, base: baseColor, baseEdge, shadow } = CASE_COVER_COLORS;
  const shadowRect = { ...base, y: base.y + COVER_SHADOW.offset };

  return svg(
    [
      blurFilter,
      `<rect width="${width}" height="${height}" fill="${background}"/>`,
      rect(shadowRect, LAPTOP_FRAME.baseRadius, shadow, `opacity="${COVER_SHADOW.opacity}" filter="url(#blur)"`),
      rect(body, LAPTOP_FRAME.radius, bodyColor),
      rect(base, LAPTOP_FRAME.baseRadius, baseColor),
      rect({ ...base, height: 4 }, 0, baseEdge),
    ].join(''),
  );
};

/** Тень и корпус телефона: слой поверх ноутбука, под снимком 390. */
const phoneLayer = () => {
  const body = phoneBody();
  const shadowRect = { ...body, y: body.y + COVER_SHADOW.offset };

  return svg(
    [
      blurFilter,
      rect(
        shadowRect,
        PHONE_FRAME.radius,
        CASE_COVER_COLORS.shadow,
        `opacity="${COVER_SHADOW.opacity}" filter="url(#blur)"`,
      ),
      rect(body, PHONE_FRAME.radius, CASE_COVER_COLORS.body),
    ].join(''),
  );
};

/** Снимок в размер экрана: заполняет экран целиком, лишнее срезается снизу — на экране начало страницы. */
const fitScreen = (path: string, screen: Rect) =>
  sharp(path).resize(screen.width, screen.height, { fit: 'cover', position: 'top' }).png().toBuffer();

/** Экран телефона со скругленными углами: маска — прямоугольник со скруглением экрана. */
const roundScreen = (image: Buffer, screen: Rect) =>
  sharp(image)
    .composite([
      {
        input: svg(rect({ ...screen, x: 0, y: 0 }, PHONE_FRAME.screenRadius, '#ffffff'), screen),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

/**
 * Что не так со входом обложки: файла нет или это не PNG; годный вход — `null`. Проверка до записи, чтобы на ошибке
 * не оставался полуготовый файл.
 */
export const checkCoverInput = async (path: string): Promise<CaseCoverInputProblem | null> => {
  try {
    await access(path);
  } catch {
    return { message: `Файл не найден: ${path}` };
  }

  const { format } = await sharp(path)
    .metadata()
    .catch(() => ({ format: undefined }));

  return format === 'png' ? null : { message: `Нужен снимок PNG: ${path}` };
};

/** Коллаж «ноутбук + телефон» по одному шаблону: снимок 1440 — на экран ноутбука, снимок 390 — на экран телефона. */
export const composeCaseCover = async (desktopPath: string, mobilePath: string, outputPath: string): Promise<void> => {
  const [desktop, mobile] = await Promise.all([fitScreen(desktopPath, laptop), fitScreen(mobilePath, phone)]);
  const mobileRounded = await roundScreen(mobile, phone);

  const cover = await sharp(laptopLayer())
    .composite([
      { input: desktop, left: laptop.x, top: laptop.y },
      { input: phoneLayer(), left: 0, top: 0 },
      { input: mobileRounded, left: phone.x, top: phone.y },
    ])
    .png()
    .toBuffer();

  await sharp(cover).png().toFile(outputPath);
};
