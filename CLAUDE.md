# CLAUDE.md — site (сайт студии MRSHKN)

Репозиторий сайта mrshkn.com. Решения по студии — `../PLAN.md`, порядок работ и критерии
приемки — `../ROADMAP.md`, артборды направлений — `../design/*.dc.html`.

## Стек

Next.js 16 (App Router, Turbopack, `proxy.ts` вместо `middleware.ts`), React 19, TypeScript,
SCSS-модули, next-intl 4 (ru/en), next-themes. Пакетный менеджер — Yarn 4 через corepack.

## Структура

```
src/app/[locale]/    layout (html, метаданные, провайдеры, Header и Footer направления) и страницы
src/designs/         реестр направлений: consts, types, registry, fonts (next/font), server (cookie)
src/designs/<name>/  Header, Footer, Hero направления + их SCSS-модули
src/components/      общие компоненты вне направлений: ThemeToggle, LocaleSwitcher, icons
src/i18n/            routing, request, navigation, consts
src/lib/             окружение сборки и общие константы
src/styles/          globals.scss (база) и designs/<name>.scss (токены направления)
messages/            ru.json, en.json, TRANSLATION-TODO.md
tests/unit/          Vitest
tests/e2e/           Playwright + эталоны скриншотов (*-snapshots/)
```

## Две оси: тема и направление

У сайта цветовая тема (`data-theme`, next-themes) и направление дизайна (`data-design`).
Направлений пять: kinetic (дефолт), terminal, pop, swiss, editorial.

Секции берутся из реестра: `getSection(design, 'header' | 'hero' | 'footer')`. Если у направления
секция еще не написана, реестр отдает реализацию дефолтного направления — так сайт живет, пока
направления реализуются по очереди. Направление на сервере читает `getDesign()` из
`src/designs/server.ts` (cookie `design`, неизвестное значение → дефолт). Динамическую секцию
layout рендерит через `createElement(getSection(...))`: JSX-тег из переменной, вычисленной
в рендере, ловит `react-hooks/static-components`; на уровне модуля (как Hero в `page.tsx`)
`getSection` можно вызывать напрямую.

Токены направления лежат в `src/styles/designs/<name>.scss`: блок `[data-design='<name>']`
(светлая тема, шрифты, радиусы, толщины рамок, тени) и `[data-design='<name>'][data-theme='dark']`
(цвета темной темы). Общий контракт токенов — список `REQUIRED_TOKENS` в
`tests/unit/design-tokens.test.ts`; направление может добавлять свои (`--ok`, `--accent-alt`).
Вне файлов токенов SCSS не содержит литералов цветов, `font-family`, `border-radius`,
`box-shadow` и толщин `border` — только `var(--…)`; это проверяет тот же тест.

Шрифты — `src/designs/fonts.ts`, все через `next/font/google` с `display: swap`; на `<html>`
вешаются только переменные активного направления (`DESIGN_FONT_CLASSES`). Preload включен
только у шрифтов дефолтного направления (Kinetic): preload остальных четырех пар — лишние
загрузки на каждой странице, поэтому у них `preload: false`, и они подхватываются из CSS.

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

Эталоны `toHaveScreenshot` (`tests/e2e/*-snapshots/*-darwin.png`) сняты на macOS и сравниваются
только на macOS — на Linux-раннере CI визуальный describe пропускается, структурные проверки
шапки и подвала идут везде. Обновить эталоны после осознанного изменения верстки:
`yarn test:e2e design-shell --update-snapshots`, диф эталонов смотреть глазами.

Новый критерий из ROADMAP сначала становится тестом, потом кодом.

## Деплой

`main` → превью Vercel (`SITE_ENV=preview`, noindex). Боевой mrshkn.com живет на VPS с Coolify,
туда сайт переезжает отдельным блоком роадмапа. Секреты — только в секретах хостинга.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
