import config from '@payload-config';
import type {} from '@payloadcms/db-postgres';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getPayload, type Payload } from 'payload';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrations } from '@/migrations';

let payload: Payload;

/** Базовый адаптер Payload объявляет миграции с аргументами `unknown`, а файлы миграций — с аргументами Postgres. */
type MigrationList = NonNullable<NonNullable<Parameters<Payload['db']['migrate']>[0]>['migrations']>;

beforeAll(async () => {
  payload = await getPayload({ config });
});

afterAll(async () => {
  await payload.destroy();
});

/**
 * Схему базы на сервере создают миграции, а в разработке Payload накатывает ее сам. Поле, добавленное в коллекцию
 * без миграции, в разработке работает, а на stage падает на первом запросе. Тест сравнивает то же, что
 * `payload migrate:create`: снимок последней миграции со схемой из конфига.
 */
describe('миграции', () => {
  it('схема из миграций совпадает со схемой конфига — иначе `yarn payload migrate:create <имя>`', async () => {
    const { generateDrizzleJson, generateMigration } = payload.db.requireDrizzleKit();
    const directory = payload.db.migrationDir;
    const snapshots = existsSync(directory)
      ? readdirSync(directory)
          .filter((file) => file.endsWith('.json'))
          .sort()
      : [];
    const latest = snapshots.at(-1);
    const before = latest
      ? JSON.parse(readFileSync(path.join(directory, latest), 'utf8'))
      : payload.db.defaultDrizzleSnapshot;

    const statements = await generateMigration(before, await generateDrizzleJson(payload.db.schema));

    expect(statements).toEqual([]);
  });
});

/**
 * Людей студии на сайте нет: коллекции нет в конфиге, а миграции, которые сервер накатывает при старте (тот же
 * список, что `prodMigrations`), не оставляют ее таблиц. Схема стирается и до, и после: иначе следующий файл получит
 * базу со строками `payload_migrations`, и push Payload спросит в терминале, можно ли терять данные.
 */
describe('коллекции команды нет', () => {
  it('в конфиге Payload нет коллекции team', () => {
    expect(payload.config.collections.map((collection) => collection.slug)).not.toContain('team');
  });

  it('после всех миграций в базе нет таблиц team* и связи team_id у блокировок документов', async () => {
    const url = process.env.DATABASE_URI ?? '';

    if (!new URL(url).pathname.endsWith('_test')) {
      throw new Error(`тест стирает базу, а ${url} не похожа на тестовую (имя должно кончаться на _test)`);
    }

    const client = new Client({ connectionString: url });
    const resetSchema = () => client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');

    await client.connect();

    try {
      await resetSchema();
      await payload.db.migrate({ migrations: migrations as unknown as MigrationList });

      const tables = await client.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name LIKE 'team%' ORDER BY table_name`,
      );
      const columns = await client.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'payload_locked_documents_rels' AND column_name = 'team_id'`,
      );

      expect(tables.rows.map((row) => row.table_name)).toEqual([]);
      expect(columns.rows.map((row) => row.column_name)).toEqual([]);
    } finally {
      await resetSchema();
      await client.end();
    }
  });
});
