---
paths:
  - 'lighthouserc.cjs'
  - 'scripts/lighthouse.mjs'
  - 'tests/unit/lighthouse-config.test.ts'
  - '.github/workflows/**'
---

# Lighthouse CI

- `scripts/lighthouse.mjs` гоняет `lhci autorun` пять раз — по одному на направление, на каждом два адреса: главная
  и `/ru/work/lighthouse-demo` (страница засеянного кейса; слаг тот же, что в `scripts/seed-lighthouse.ts`). Cookie `design` задается через
  `LIGHTHOUSE_DESIGN` в `lighthouserc.cjs`, отчеты — в `.lighthouseci/<design>/`.
- Сборка production — с `NEXT_PUBLIC_SITE_URL`, совпадающим с адресом сервера, иначе canonical указывает на чужой origin
  и SEO-аудит падает.
- Главная и страница кейса читают CMS, поэтому джоба поднимает Postgres (`services.postgres`), после сборки накатывает
  миграции (`yarn payload migrate`) и засевает один кейс (`yarn seed:lighthouse`) — до `test:lighthouse`. Засев —
  `scripts/seed-lighthouse.ts`: через Local API опубликованный кейс с обложкой и скрином (картинки рисует sharp,
  в git их нет), нейтральные служебные тексты (D14); каждый запуск пересоздает кейс и картинки, так что он идемпотентен.
- Локально: `docker compose up -d`, затем в одном окружении `DATABASE_URI=postgres://site:site@127.0.0.1:5434/site_test
PAYLOAD_SECRET=local node scripts/prepare-database.ts` (стирает схему базы `*_test` и накатывает миграции), тот же
  `DATABASE_URI` и `yarn seed:lighthouse`, потом `yarn build:lighthouse && yarn test:lighthouse` с тем же
  `DATABASE_URI`. На базе `site` (разработка, схема от push) `payload migrate` спросил бы про потерю данных.
- Порог — `aggregationMethod: 'pessimistic'`: у каждого из трех прогонов, не у лучшего (так LHCI считает по умолчанию).
  Числа и запрет ослаблять — в `CLAUDE.md`.
- Перед пятью замерами скрипт делает один прогревочный `lhci collect` и выбрасывает результат: первый Lighthouse на свежем
  раннере GitHub стабильно давал TBT 430–540 мс против 95–160 у всех следующих (холодный Chrome и Node, benchmarkIndex
  ниже) — свойство раннера, не сайта.
- `tests/unit/lighthouse-config.test.ts` держит конфиг от случайного отката.
