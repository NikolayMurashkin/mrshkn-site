# CLAUDE.md — site (сайт студии MRSHKN)

Репозиторий сайта mrshkn.com. Решения по студии — `../PLAN.md`, порядок работ и критерии
приемки — `../ROADMAP.md`, артборды направлений — `../design/*.dc.html`.

## Стек

Next.js 16 (App Router, Turbopack, `proxy.ts` вместо `middleware.ts`), React 19, TypeScript,
SCSS-модули, next-intl 4 (ru/en), next-themes. Пакетный менеджер — Yarn 4 через corepack.

## Структура

```
src/app/[locale]/    layout (html, метаданные, провайдеры) и страницы
src/app/fonts.ts     next/font: Unbounded (display) + Golos Text (текст)
src/designs/         реестр направлений: consts, types, registry + папка на направление
src/components/      общие компоненты вне направлений
src/i18n/            routing, request, navigation, consts
src/lib/             окружение сборки и общие константы
src/styles/          globals.scss: токены направления и база
messages/            ru.json, en.json, TRANSLATION-TODO.md
tests/unit/          Vitest
tests/e2e/           Playwright
```

## Две оси: тема и направление

У сайта цветовая тема (`data-theme`, next-themes) и направление дизайна (`data-design`).
Направлений пять: kinetic (дефолт), terminal, pop, swiss, editorial.

Секции берутся из реестра: `getSection(design, 'hero')`. Если у направления секция еще не
написана, реестр отдает реализацию дефолтного направления — так сайт живет, пока направления
реализуются по очереди. Вызов `getSection` делается на уровне модуля, а не внутри рендера:
иначе `react-hooks/static-components` справедливо ругается на компонент, созданный в рендере.

Токены направления объявлены в `globals.scss` селекторами `[data-design='...']` и
`[data-design='...'][data-theme='dark']`. Отдельные файлы токенов на каждое направление
появятся вместе с их Header/Footer.

## Соглашения

- Компоненты — стрелочные функции; тип пропсов `ComponentNameProps` через `type`.
- Константы и типы — в `consts.ts` и `types.ts`, не в файле компонента.
- SCSS без комментариев; медиазапросы только `max-width`; `hyphens: none`.
- Текст из CMS и от бэкенда не вылезает из контейнера: `overflow-wrap: anywhere`, `min-width: 0`.
- Prettier: 120 символов, одинарные кавычки, точка с запятой, один атрибут на строку.
- Буква «е» вместо «ё»; после «в», «к», «с», «на», «и» — неразрывный пробел.
- Английские тексты Claude не сочиняет. Нет перевода — в `en.json` кладется русская строка,
  ключ добавляется в `messages/TRANSLATION-TODO.md`, перевод пишет Николай.

## Тесты

Vitest — чистые функции (реестр, режим индексации). Playwright — реальные сборки: конфиг
поднимает два сервера, `preview` на 3100 и `production` на 3101, поэтому разница по
`SITE_ENV` проверяется на настоящем HTML, а не на моках. Lighthouse CI гоняется по
production-сборке с `NEXT_PUBLIC_SITE_URL`, совпадающим с адресом сервера, иначе canonical
указывает на чужой origin и SEO-аудит падает.

Новый критерий из ROADMAP сначала становится тестом, потом кодом.

## Деплой

`main` → превью Vercel (`SITE_ENV=preview`, noindex). Боевой mrshkn.com живет на VPS с Coolify,
туда сайт переезжает отдельным блоком роадмапа. Секреты — только в секретах хостинга.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
