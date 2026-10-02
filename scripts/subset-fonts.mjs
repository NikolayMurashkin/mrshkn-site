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
    output: 'ibm-plex-sans.woff2',
    variationAxes: { wght: { min: 400, max: 700 }, wdth: 100 },
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

for (const font of FONTS) {
  const outputDir = join(ROOT, 'src/designs', font.design, 'fonts');
  await mkdir(outputDir, { recursive: true });

  const source = await download(`${font.directory}/${encodeURIComponent(font.source)}`);
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

  console.log(`${font.design}/${font.output}: ${source.length} → ${subset.length} bytes`);
}
