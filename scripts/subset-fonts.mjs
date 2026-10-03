import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import { GLYPHS } from './subset-glyphs.ts';

const GOOGLE_FONTS_COMMIT = 'e44c4b011a820c2cbe2fd2cfa8052037d7edb571';
const GOOGLE_FONTS_RAW = `https://raw.githubusercontent.com/google/fonts/${GOOGLE_FONTS_COMMIT}/ofl`;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const FONTS = [
  {
    design: 'kinetic',
    directory: 'unbounded',
    source: 'Unbounded[wght].ttf',
    output: 'unbounded.woff2',
    variationAxes: { wght: { min: 700, max: 900 } },
  },
  {
    design: 'kinetic',
    directory: 'golostext',
    source: 'GolosText[wght].ttf',
    output: 'golos-text.woff2',
    variationAxes: { wght: { min: 400, max: 600 } },
  },
  {
    design: 'terminal',
    directory: 'jetbrainsmono',
    source: 'JetBrainsMono[wght].ttf',
    output: 'jetbrains-mono.woff2',
    variationAxes: { wght: { min: 400, max: 700 } },
  },
  {
    design: 'terminal',
    directory: 'ibmplexsans',
    source: 'IBMPlexSans[wdth,wght].ttf',
    output: 'terminal-sans.woff2',
    variationAxes: { wght: { min: 400, max: 700 }, wdth: 100 },
    rename: { 'IBM Plex Sans': 'Terminal Sans', IBMPlexSans: 'TerminalSans' },
  },
  {
    design: 'pop',
    directory: 'rubik',
    source: 'Rubik[wght].ttf',
    output: 'rubik.woff2',
    variationAxes: { wght: { min: 500, max: 900 } },
  },
  {
    design: 'swiss',
    directory: 'geologica',
    source: 'Geologica[CRSV,SHRP,slnt,wght].ttf',
    output: 'geologica.woff2',
    variationAxes: { wght: { min: 300, max: 800 }, CRSV: 0, SHRP: 0, slnt: 0 },
  },
  {
    design: 'editorial',
    directory: 'prata',
    source: 'Prata-Regular.ttf',
    output: 'prata.woff2',
  },
  {
    design: 'editorial',
    directory: 'onest',
    source: 'Onest[wght].ttf',
    output: 'onest.woff2',
    variationAxes: { wght: { min: 400, max: 600 } },
  },
];

const download = async (path) => {
  const response = await fetch(`${GOOGLE_FONTS_RAW}/${path}`);
  if (!response.ok) {
    throw new Error(`${path}: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

// Сабсет по OFL — Modified Version: зарезервированное имя (у IBM Plex — «Plex») ему носить нельзя.
// Новая таблица name дописывается в конец исходника, harfbuzz при сабсете соберет файл заново без старой.
const NOTICE_NAME_IDS = new Set([0, 7, 13, 14]);

const renameFont = (font, rename) => {
  const tables = Array.from({ length: font.readUInt16BE(4) }, (_, index) => 12 + index * 16);
  const record = tables.find((offset) => font.toString('latin1', offset, offset + 4) === 'name');
  const table = font.readUInt32BE(record + 8);

  if (font.readUInt16BE(table) !== 0) {
    throw new Error(`таблица name формата ${font.readUInt16BE(table)}, переименование умеет только формат 0`);
  }

  const count = font.readUInt16BE(table + 2);
  const strings = table + font.readUInt16BE(table + 4);
  const records = Array.from({ length: count }, (_, index) => {
    const offset = table + 6 + index * 12;
    const [platform, encoding, language, nameId, length, start] = [0, 2, 4, 6, 8, 10].map((field) =>
      font.readUInt16BE(offset + field),
    );
    const raw = font.subarray(strings + start, strings + start + length);

    if (NOTICE_NAME_IDS.has(nameId)) return { platform, encoding, language, nameId, bytes: raw };

    const utf16 = platform !== 1;
    const text = Object.entries(rename).reduce(
      (value, [from, to]) => value.replaceAll(from, to),
      utf16 ? Buffer.from(raw).swap16().toString('utf16le') : raw.toString('latin1'),
    );
    const bytes = utf16 ? Buffer.from(text, 'utf16le').swap16() : Buffer.from(text, 'latin1');

    return { platform, encoding, language, nameId, bytes };
  });

  const header = Buffer.alloc(6 + count * 12);
  header.writeUInt16BE(0, 0);
  header.writeUInt16BE(count, 2);
  header.writeUInt16BE(header.length, 4);

  let stringOffset = 0;
  records.forEach(({ platform, encoding, language, nameId, bytes }, index) => {
    [platform, encoding, language, nameId, bytes.length, stringOffset].forEach((value, field) =>
      header.writeUInt16BE(value, 6 + index * 12 + field * 2),
    );
    stringOffset += bytes.length;
  });

  const name = Buffer.concat([header, ...records.map(({ bytes }) => bytes)]);
  const padded = Buffer.concat([name, Buffer.alloc((4 - (name.length % 4)) % 4)]);
  let checksum = 0;
  for (let offset = 0; offset < padded.length; offset += 4) {
    checksum = (checksum + padded.readUInt32BE(offset)) >>> 0;
  }

  const renamed = Buffer.concat([font, Buffer.alloc((4 - (font.length % 4)) % 4), padded]);
  renamed.writeUInt32BE(checksum, record + 4);
  renamed.writeUInt32BE(renamed.length - padded.length, record + 8);
  renamed.writeUInt32BE(name.length, record + 12);

  return renamed;
};

for (const font of FONTS) {
  const outputDir = join(ROOT, 'src/designs', font.design, 'fonts');
  await mkdir(outputDir, { recursive: true });

  const original = await download(`${font.directory}/${encodeURIComponent(font.source)}`);
  const source = font.rename ? renameFont(original, font.rename) : original;
  const subset = await subsetFont(source, GLYPHS, {
    targetFormat: 'woff2',
    variationAxes: font.variationAxes,
    noLayoutClosure: true,
  });

  await writeFile(join(outputDir, font.output), subset);
  await writeFile(
    join(outputDir, `${font.output.replace(/\.woff2$/, '')}-OFL.txt`),
    await download(`${font.directory}/OFL.txt`),
  );

  console.log(`${font.design}/${font.output}: ${original.length} → ${subset.length} bytes`);
}
