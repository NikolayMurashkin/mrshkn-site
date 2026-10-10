import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { LOGO_SIZE } from '@/lib/seo/consts';

export const dynamic = 'force-static';

/** Знак сайта из `icon.svg` растром: `Organization.logo` в schema.org SVG не принимает. */
export const GET = async () => {
  const icon = await readFile(join(process.cwd(), 'src/app/icon.svg'), 'base64');

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/svg+xml;base64,${icon}`}
        width={LOGO_SIZE.width}
        height={LOGO_SIZE.height}
        alt=""
      />
    </div>,
    LOGO_SIZE,
  );
};
