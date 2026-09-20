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
    weight: { min: 700, max: 900 },
  },
  {
    design: 'kinetic',
    directory: 'golostext',
    source: 'GolosText[wght].ttf',
    output: 'golos-text.woff2',
    weight: { min: 400, max: 600 },
  },
];

const download = async (path) => {
  const response = await fetch(`${GOOGLE_FONTS_RAW}/${path}`);
  if (!response.ok) {
    throw new Error(`${path}: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

for (const font of FONTS) {
  const outputDir = join(ROOT, 'src/designs', font.design, 'fonts');
  await mkdir(outputDir, { recursive: true });

  const source = await download(`${font.directory}/${encodeURIComponent(font.source)}`);
  const subset = await subsetFont(source, GLYPHS, {
    targetFormat: 'woff2',
    variationAxes: { wght: font.weight },
    noLayoutClosure: true,
  });

  await writeFile(join(outputDir, font.output), subset);
  await writeFile(
    join(outputDir, `${font.output.replace(/\.woff2$/, '')}-OFL.txt`),
    await download(`${font.directory}/OFL.txt`),
  );

  console.log(`${font.design}/${font.output}: ${source.length} → ${subset.length} bytes`);
}
