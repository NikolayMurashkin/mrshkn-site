import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

/**
 * База тестовых серверов: схема стирается и накатывается миграциями, как на stage. Интеграционные тесты и
 * разработка оставляют схему, созданную Payload сам (push) → `payload migrate` на ней спросил бы в терминале,
 * можно ли терять данные. Защита — имя базы кончается на `_test`.
 */
const url = process.env.DATABASE_URI ?? '';

if (!url.includes('://') || !new URL(url).pathname.endsWith('_test')) {
  throw new Error(
    `схема стирается, а ${url || 'DATABASE_URI'} не похожа на тестовую базу (имя должно кончаться на _test)`,
  );
}

const client = new Client({ connectionString: url });

await client.connect();
await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
await client.end();

const { status } = spawnSync('yarn', ['payload', 'migrate'], { stdio: 'inherit', env: process.env });

process.exit(status ?? 1);
