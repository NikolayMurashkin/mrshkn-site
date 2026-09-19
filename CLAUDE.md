# CLAUDE.md — site (сайт студии MRSHKN)

Репозиторий сайта mrshkn.com. Решения по студии — `../PLAN.md`, порядок работ и критерии
приемки — `../ROADMAP.md`, артборды направлений — `../design/*.dc.html`.

## Стек

Next.js 16 (App Router, Turbopack, `proxy.ts` вместо `middleware.ts`), React 19, TypeScript,
SCSS-модули, next-intl 4 (ru/en), next-themes. Пакетный менеджер — Yarn 4 через corepack.

## Структура

```
src/app/[locale]/    layout (html, метаданные, провайдеры, Header и Footer направления, пилюля) и страницы
src/designs/         реестр направлений: consts, types, registry (next/dynamic), resolve, server (cookie)
src/designs/<name>/  index (клиентский модуль-чанк), fonts (next/font), Header, Hero, Footer + SCSS-модули
src/components/      общие компоненты вне направлений: DesignSwitcher, ThemeToggle, LocaleSwitcher, icons
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

Секции направления — клиентские компоненты. У каждого направления один модуль-чанк
`src/designs/<name>/index.tsx` (`'use client'`), который отдает `<Name>Section({ section })`
и подключает шрифты направления (`import './fonts'`). Реестр `src/designs/registry.tsx` заводит
на каждый модуль `next/dynamic(() => import('./<name>'))` — литеральный `import()` внутри
`dynamic()` обязателен: по нему Next кладет в SSR-HTML `<link rel="stylesheet" data-precedence="dynamic">`
ровно с CSS этого направления (серверный `import()` так не умеет — Turbopack линкует все чанки разом).
Layout и страница рендерят `<DesignSection design section="header" | "hero" | "footer" />`;
внутри — `createElement(...)`, потому что JSX-тег из переменной ловит `react-hooks/static-components`.
Все пять направлений реализуют все секции: fallback на дефолтное направление убран.
Направление на сервере читает `getDesign()` из `src/designs/server.ts` (cookie `design`,
неизвестное значение → дефолт через `resolveDesign` из `resolve.ts`, он без `'use client'`).

Переключатель — `src/components/DesignSwitcher.tsx` (пилюля «Стиль: …» внизу справа): пишет
cookie на клиенте, делает `router.refresh()` (soft, скролл и состояние на месте), оборачивает
коммит в `document.startViewTransition` и ждет его через `useLayoutEffect` по пропу `design`;
чанк выбранного направления подгружается `preloadDesign` параллельно с refresh. Тема по умолчанию
у направления своя (`DESIGN_DEFAULT_THEME`: Kinetic и Terminal темные, остальные светлые, как на
артбордах); если пользователь тему не выбирал (`localStorage.theme` пуст), при смене направления
она переключается на дефолт нового направления и снова не считается выбранной. Источник истины
выбранной темы — localStorage (next-themes); `ThemeCookieSync` внутри `ThemeProvider` зеркалит
ее в cookie `theme` при загрузке и при каждой смене (только когда тема действительно выбрана).
Cookie нужна серверу — `getTheme()` из `src/components/theme-server.ts` рендерит `data-theme`
на `<html>`, иначе `router.refresh()` при смене направления перетирал бы тему, выставленную
next-themes в DOM, дефолтом нового направления, а полная навигация (смена языка) отдавала бы
дефолт, который скрипт next-themes тут же менял на сохраненный. Побочный плюс — у вернувшегося
пользователя тема совпадает с SSR, мигания нет.

Токены направления лежат в `src/styles/designs/<name>.scss`: блок `[data-design='<name>']`
(светлая тема, шрифты, радиусы, толщины рамок, тени) и `[data-design='<name>'][data-theme='dark']`
(цвета темной темы). Общий контракт токенов — список `REQUIRED_TOKENS` в
`tests/unit/design-tokens.test.ts`; направление может добавлять свои (`--ok`, `--accent-alt`,
`--radius-round`). Вне файлов токенов SCSS не содержит литералов цветов, `font-family`,
`border-radius`, `box-shadow` и толщин `border` — только `var(--…)`; это проверяет тот же тест.

Шрифты — `src/designs/<name>/fonts.ts`, через `next/font/google` с `display: swap` и
`preload: false`; модуль подключается из `index.tsx` как `import './fonts'` ради `@font-face`, а токены
ссылаются на семейства по имени (`'Unbounded', 'Unbounded Metric Fallback', …`), поэтому `@font-face`
едут в CSS-чанк направления, а не в общий CSS. Константы в `fonts.ts` никто не импортирует: next/font
требует `const` на уровне модуля, а неиспользуемую константу без `export` ESLint отметит предупреждением —
`export` здесь только ради этого. Preload включать нельзя: манифест шрифтов у Next на entry, и подсказки
preload уходят всем направлениям сразу (по замеру это роняло Lighthouse чужих направлений до 78–89);
без preload все пять держат 93–98.
Метрические fallback-начертания `'<Family> Metric Fallback'` объявлены руками в файле токенов:
собственный fallback next/font (`'<Family> Fallback'`) ссылается только на `local(Arial)`, которого нет
на Linux и Android — там текст до загрузки шрифта был на четверть уже и прыгал (CLS 0,12–0,47,
Lighthouse на CI 88). Наши начертания перечисляют `local('Arial'), local('Liberation Sans'),
local('Roboto')`, а `ascent/descent/size-adjust` скопированы из начертания next/font в CSS-чанке
(оттуда же брать при смене шрифта). Имя нарочно не совпадает с next/font'овским: `adjustFontFallback:
false` в Turbopack (Next 16.3.5) не действует, `@font-face '<Family> Fallback'` с `local(Arial)` все
равно лежит в чанке, и при одинаковом имени выбор начертания зависел бы от порядка `<link>` и того,
пропустит ли браузер начертание с неразрешимым `local()`.

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
`SITE_ENV` проверяется на настоящем HTML, а не на моках. Lighthouse CI (`scripts/lighthouse.mjs`)
гоняет `lhci autorun` пять раз — по одному на направление, cookie `design` задается через
`LIGHTHOUSE_DESIGN` в `lighthouserc.cjs`, отчеты в `.lighthouseci/<design>/`; сборка production
с `NEXT_PUBLIC_SITE_URL`, совпадающим с адресом сервера, иначе canonical указывает на чужой origin
и SEO-аудит падает.

Эталоны `toHaveScreenshot` (`tests/e2e/*-snapshots/*-darwin.png`) сняты на macOS и сравниваются
только на macOS — на Linux-раннере CI визуальный describe пропускается, структурные проверки
шапки, hero и подвала идут везде. На время снимка пилюля переключателя скрыта
(`tests/e2e/screenshot.css`). Обновить эталоны после осознанного изменения верстки:
`yarn test:e2e design-shell --update-snapshots`, диф эталонов смотреть глазами; изменение высоты
секции выше сдвигает подвал на доли пикселя, и его эталон тоже приходится переснимать.

Новый критерий из ROADMAP сначала становится тестом, потом кодом.

## Деплой

`main` → превью Vercel (`SITE_ENV=preview`, noindex). Боевой mrshkn.com живет на VPS с Coolify,
туда сайт переезжает отдельным блоком роадмапа. Секреты — только в секретах хостинга.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
