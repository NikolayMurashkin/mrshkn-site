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

/** Код в адресе страницы отзыва — пропуск к форме: по ссылке со страницы он не должен уйти чужому сайту в Referer. */
const REVIEW_HEADERS = {
  source: '/:locale/review/:code',
  headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
};

/**
 * `withPayload` вешает подсказку клиента о теме (`Accept-CH`, `Critical-CH`) на все адреса, а нужна она только
 * админке: на странице сайта Chrome из-за `Critical-CH` повторяет запрос документа при первом визите.
 */
const headers: NextConfig['headers'] = async () => [
  ...((await payloadConfig.headers?.()) ?? []).map((rule) =>
    rule.headers.some(({ key }) => key === 'Critical-CH') ? { ...rule, source: '/admin/:path*' } : rule,
  ),
  REVIEW_HEADERS,
];

const config: NextConfig = { ...payloadConfig, headers };

export default config;
