import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { ru } from '@payloadcms/translations/languages/ru';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Users } from './cms/collections/Users';
import { COLLECTIONS, GLOBALS } from './cms/schema';
import { DEFAULT_LOCALE, LOCALES } from './i18n/consts';
import { migrations } from './migrations';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: ' · MRSHKN, CMS' },
  },
  collections: COLLECTIONS,
  globals: GLOBALS,
  editor: lexicalEditor(),
  localization: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    fallback: true,
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Только у баз, которые ведутся миграциями, — на сервере (флаг задан в образе). Базу разработки Payload
    // накатывает сам, и на ней миграции при старте спросили бы в терминале, можно ли терять данные.
    prodMigrations: process.env.MIGRATE_ON_START === 'true' ? migrations : undefined,
  }),
  graphQL: { disable: true },
  i18n: { fallbackLanguage: 'ru', supportedLanguages: { ru } },
  secret: process.env.PAYLOAD_SECRET ?? '',
  sharp,
  telemetry: false,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
});
