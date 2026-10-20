import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * CRM студии живет в админке сайта, канал Bitrix24 удален из кода целиком: обработчик, адрес вебхука и его описание
 * в образце окружения. Тест читает каждый файл `src/` и `.env.example` и ловит любое упоминание в любом регистре.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(ROOT, join(entry.parentPath, entry.name)));

describe('Bitrix24 в коде сайта нет', () => {
  it('N1: ни один файл src/ и .env.example не упоминает bitrix в любом регистре', () => {
    const files = [...listFiles(join(ROOT, 'src')), '.env.example'];
    const found = files.filter((path) => /bitrix/i.test(readFileSync(join(ROOT, path), 'utf8')));

    expect(files.length, 'файлов в src/').toBeGreaterThan(1);
    expect(found, 'файлы с упоминанием bitrix').toEqual([]);
  });
});
