---
paths:
  - 'Dockerfile'
  - '.dockerignore'
  - 'next.config.ts'
  - 'src/lib/site-env.ts'
  - '.github/workflows/ci.yml'
---

# Образ и Coolify

## Образ

- Образ собирает джоб `image` в `.github/workflows/ci.yml` по `Dockerfile` в корне (D41): `output: 'standalone'`
  в `next.config.ts`, образ запускает `node server.js` на порту 3000 без полного `node_modules`.
- `SITE_ENV` и `NEXT_PUBLIC_SITE_URL` нужны и при сборке (адрес вшивается в клиентский код), и при работе: при сборке —
  `build-args` джоба `image`, при работе — переменные Coolify; меняется адрес стенда → править оба места. Остальные
  переменные — только при работе. Сборке база не нужна.
- Проверить образ локально: `docker build --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3210 -t mrshkn-site:local .`,
  затем `docker run --rm -p 3210:3000 mrshkn-site:local`.
- Тесты и Lighthouse CI поднимают сайт через `next start`, Next пишет в их лог
  `"next start" does not work with "output: standalone"`. Предупреждение безвредно, сервер работает, но сьют проверяет
  `next start`, а не `node server.js` из образа, разницу тесты не видят → правку `Dockerfile` или `next.config.ts`
  проверять сборкой и запуском образа руками.

## Переменные и тома в Coolify

- Приложение — Docker Image `ghcr.io/nikolaymurashkin/mrshkn-site`, тег ставит джоб `image`. Переменные работы:
  `SITE_ENV=preview`, `NEXT_PUBLIC_SITE_URL`, `DATABASE_URI` (Postgres `site-postgres` в том же окружении,
  внутренний адрес) и `PAYLOAD_SECRET`.
- Медиатека Payload живет в томе на `/app/media`: без тома картинки пропадут при следующем деплое.
- Адрес закрыт basic-auth Coolify, сертификат — общий wildcard (запрет своего — в `CLAUDE.md`).
