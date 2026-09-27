import { withPayload } from '@payloadcms/next/withPayload';
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  output: 'standalone',
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
};

const payloadConfig = withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false });

/**
 * `withPayload` вешает подсказку клиента о теме (`Accept-CH`, `Critical-CH`) на все адреса, а нужна она только
 * админке: на странице сайта Chrome из-за `Critical-CH` повторяет запрос документа при первом визите.
 */
const headers: NextConfig['headers'] = async () =>
  ((await payloadConfig.headers?.()) ?? []).map((rule) =>
    rule.headers.some(({ key }) => key === 'Critical-CH') ? { ...rule, source: '/admin/:path*' } : rule,
  );

const config: NextConfig = { ...payloadConfig, headers };

export default config;
