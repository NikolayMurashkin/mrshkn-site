---
paths:
  - "Dockerfile"
  - ".dockerignore"
  - "next.config.ts"
  - "src/lib/site-env.ts"
---

# Образ и Coolify

## Образ

- Coolify собирает сайт по `Dockerfile` в корне: `output: 'standalone'` в `next.config.ts`, образ запускает
  `node server.js` на порту 3000 без полного `node_modules`.
- `SITE_ENV` и `NEXT_PUBLIC_SITE_URL` нужны и при сборке (адрес вшивается в клиентский код), и при работе; остальные
  переменные — только при работе.
- Проверить образ локально: `docker build --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3210 -t mrshkn-site:local .`,
  затем `docker run --rm -p 3210:3000 mrshkn-site:local`.
- Тесты и Lighthouse CI поднимают сайт через `next start`, Next пишет в их лог
  `"next start" does not work with "output: standalone"`. Предупреждение безвредно, сервер работает, но сьют проверяет
  `next start`, а не `node server.js` из образа, разницу тесты не видят → правку `Dockerfile` или `next.config.ts`
  проверять сборкой и запуском образа руками.

## Переменные и тома в Coolify

- `SITE_ENV=preview` и `NEXT_PUBLIC_SITE_URL` отмечены и для сборки, и для работы; `DATABASE_URI` (Postgres
  `site-postgres` в том же окружении, внутренний адрес) и `PAYLOAD_SECRET` — только для работы.
- Медиатека Payload живет в томе на `/app/media`: без тома картинки пропадут при следующем деплое.
- Адрес закрыт basic-auth Coolify, сертификат — общий wildcard (запрет своего — в `CLAUDE.md`).
