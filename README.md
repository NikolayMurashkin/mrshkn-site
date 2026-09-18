# MRSHKN — сайт студии

Next.js 16 + TypeScript + SCSS-модули, next-intl (ru/en), next-themes.
Решения по студии — в `../PLAN.md`, порядок работ — в `../ROADMAP.md`.

## Запуск

```bash
corepack enable
yarn install
yarn dev            # http://localhost:3000 → редирект на /ru или /en
```

## Команды

| Команда                                          | Что делает                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| `yarn dev`                                       | дев-сервер                                                              |
| `yarn build`                                     | production-сборка                                                       |
| `yarn typecheck`                                 | `tsc --noEmit`                                                          |
| `yarn lint`                                      | ESLint (flat config, `eslint-config-next`)                              |
| `yarn format` / `yarn format:check`              | Prettier                                                                |
| `yarn test:unit`                                 | Vitest — реестр направлений, режим индексации                           |
| `yarn test:e2e`                                  | Playwright — поднимает две сборки (preview и production) и гоняет smoke |
| `yarn build:lighthouse` + `yarn test:lighthouse` | Lighthouse CI на `/ru`, порог 90 по performance, accessibility и SEO    |
| `yarn test`                                      | типы + линт + юниты + e2e                                               |

## Окружения

`SITE_ENV` управляет индексацией и задается на хостинге:

- `preview` (значение по умолчанию) — превью Vercel и PR-сборки, каждая страница отдает
  `<meta name="robots" content="noindex, nofollow">`;
- `production` — боевой mrshkn.com, запрета индексации нет.

Остальные переменные — в `.env.example`. Секретов в репозитории нет и не будет:
они живут в секретах Vercel и Coolify.
