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
src/designs/<name>/  index (клиентский модуль-чанк), fonts (next/font), Header, Hero, Pricing, Footer + SCSS-модули
src/components/      общие компоненты вне направлений: DesignSwitcher, ThemeToggle, LocaleSwitcher, icons
src/content/         контент, общий для всех направлений: pricing (цены), format, use-price, types
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
`dynamic()` вызывается без `loading`: так у него нет своей Suspense-границы, подвисший чанк всплывает
до уже видимой границы layout, и React при `router.refresh()` не коммитит новое направление, пока чанк
не доехал — секции появляются вместе с `data-design`, без пустого кадра (проверяет e2e «секции нового
направления появляются вместе с его атрибутом»). Добавить `loading` — значит вернуть этот пустой кадр.
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

Шрифты — `src/designs/<name>/fonts.ts`, через `next/font` с `display: swap` и
`preload: false`; модуль подключается из `index.tsx` как `import './fonts'` ради `@font-face`, а токены
ссылаются на семейства по имени (`'Unbounded', 'Unbounded Metric Fallback', …`), поэтому `@font-face`
едут в CSS-чанк направления, а не в общий CSS. Константы в `fonts.ts` никто не импортирует: next/font
требует `const` на уровне модуля, а неиспользуемую константу без `export` ESLint отметит предупреждением —
`export` здесь только ради этого. Preload включать нельзя: манифест шрифтов у Next на entry, и подсказки
preload уходят всем направлениям сразу (по замеру это роняло Lighthouse чужих направлений до 78–89);
без preload все пять держат 93–98.
Kinetic грузит шрифты не с Google, а свои сабсеты через `next/font/local`: `src/designs/kinetic/fonts/*.woff2`
(Unbounded 700–900 и Golos Text 400–600 одним вариативным файлом на семейство, только базовая латиница,
кириллица U+0400–045F и пунктуация; рядом лежат `*-OFL.txt`). Файлы Google (4 файла, 140 КБ на `/ru`)
давали Kinetic FCP 2,0 с и LCP 3,0 с против 1,2–1,7 с у остальных — в симуляции Lighthouse все байты,
доехавшие до наблюдаемого LCP, входят в его оценку; сабсеты (57 КБ) дают 99 локально и запас на раннере.
Пересобрать: `node scripts/subset-fonts.mjs` — качает исходники из `google/fonts` по закрепленному
коммиту и режет их `subset-font` (harfbuzz в wasm); вывод детерминированный, повторный запуск дает
побайтно те же файлы. Набор символов — `scripts/subset-glyphs.ts` (Node 24 импортирует `.ts` напрямую,
стирая типы, отсюда ExperimentalWarning при запуске); невидимые знаки собираются из кодов, потому что
Prettier разворачивает `\uXXXX` обратно в символы, а литеральный неразрывный пробел в дифе не виден.
Знак вне сабсета отрисуется fallback-начертанием, поэтому покрытие переводов проверяет
`tests/unit/font-subset.test.ts`: новый символ в `messages/*.json` роняет тест, и `GLYPHS` расширяется
вместе с текстом. Имя семейства в `@font-face`
задается через `declarations: [{ prop: 'font-family', … }]` — Turbopack это уважает, иначе семейство
называлось бы по имени константы.
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
- Английские тексты Claude пишет сам (решение Николая 20.09.2026, только для студии и ее проектов):
  новый ключ сразу появляется и в `ru.json`, и в `en.json` с живым английским, а строка добавляется
  в `messages/TRANSLATION-TODO.md` в таблицу «ждет вычитки» — читает и правит Николай перед публикацией.
  Английский пишется как текст для рынка, а не подстрочником: российские реалии заменяются
  международными (152-ФЗ → privacy policy, Метрика → GA4, ЮKassa → Stripe).

## Цены и контент секций

Цены живут в одном файле — `src/content/pricing.ts` (тарифы, опции, Dev-подписка и час, список
«что входит в тариф»). Рубли — решение D5 в `../PLAN.md`, доллары — таблица «Линейка» бизнес-плана
(`../docs/studio-plan.html`), кроме лендинга: у него D5 новее. Суммы форматирует `src/content/format.ts`
(`formatMoney`, `formatRange`, `planHref`) — без `Intl`, чтобы строка на сервере и в браузере совпадала
побайтно; обвязку «от», «/ мес», «+ обслуживание» дает перевод через `usePriceText`
(`src/content/use-price.ts`). Новый тариф добавляется в `pricing.ts` и в оба файла переводов —
`tests/unit/pricing.test.ts` падает, если наборы ключей разошлись.

Три блока под таблицей тарифов устроены так. База тарифа — 13 пунктов `PRICING_BASICS`, разложенных
по четырем темам `PRICING_BASIC_GROUPS`; заголовок темы лежит в `pricing.basicsGroups.<id>`, а тест
следит, чтобы группы разбирали все 13 пунктов без потерь и дублей. Опция — объект с двумя ключами:
`pricing.options.<id>.name` (имя) и `.note` (пояснение); одной строкой их писать нельзя, иначе прайс
снова читается сплошным текстом. Цену опции отдает `usePriceText().option` двумя частями — разовая
сумма и готовая подпись абонплаты (`price.monthlyAddon`), они печатаются разными элементами, поэтому
сумма не переносится посреди цифр. Имя платной опции не должно повторять обещание из базы: опция
«готов к ИИ-поиску» называется «Расширенный пакет», потому что сама готовность входит в любой тариф
по решению D13.

Разметка трех блоков общая для пяти направлений, отличаются только стили: рубрики Swiss нумеруются
CSS-счетчиком, `##` у Terminal рисуется через `::before`. Тест `tests/e2e/pricing.spec.ts` считает
строки цены через `Range`, а не `getClientRects()` самого узла: цена — прямой ребенок grid-контейнера,
блокифицирована и на любом числе строк отдает один прямоугольник.

Секция «Услуги и цены» у каждого направления своя (`src/designs/<name>/Pricing.tsx`), контент один
и тот же; ссылка тарифа ведет на страницу услуги (`/<locale>/<slug>?plan=<id>`) — сами страницы
появятся в блоке B13, до этого адреса отдают 404.

## Тесты

Vitest — чистые функции (реестр, режим индексации). Playwright — реальные сборки: конфиг
поднимает два сервера, `preview` на 3100 и `production` на 3101, поэтому разница по
`SITE_ENV` проверяется на настоящем HTML, а не на моках. Lighthouse CI (`scripts/lighthouse.mjs`)
гоняет `lhci autorun` пять раз — по одному на направление, cookie `design` задается через
`LIGHTHOUSE_DESIGN` в `lighthouserc.cjs`, отчеты в `.lighthouseci/<design>/`; сборка production
с `NEXT_PUBLIC_SITE_URL`, совпадающим с адресом сервера, иначе canonical указывает на чужой origin
и SEO-аудит падает. Порог — `aggregationMethod: 'pessimistic'`: performance ≥ 90 и accessibility 100
у **каждого** из трех прогонов, не у лучшего (так LHCI считает по умолчанию); это же обещание идет
клиенту в договор, ослаблять нельзя. Перед пятью замерами скрипт делает один прогревочный
`lhci collect` и выбрасывает результат: первый Lighthouse на свежем раннере GitHub стабильно давал
TBT 430–540 мс против 95–160 у всех следующих (холодный Chrome и Node, benchmarkIndex ниже) — это
свойство раннера, не сайта. `tests/unit/lighthouse-config.test.ts` держит конфиг от случайного отката.

Эталоны `toHaveScreenshot` (`tests/e2e/*-snapshots/*-darwin.png`) сняты на macOS и сравниваются
только на macOS — на Linux-раннере CI визуальный describe пропускается, структурные проверки
шапки, hero и подвала идут везде. На время снимка пилюля переключателя скрыта
(`tests/e2e/screenshot.css`). Обновить эталоны после осознанного изменения верстки:
`yarn test:e2e design-shell --update-snapshots`, диф эталонов смотреть глазами; изменение высоты
секции выше сдвигает подвал на доли пикселя, и его эталон тоже приходится переснимать.

`next build` в новый `NEXT_DIST_DIR` дописывает его `types/**` в `include` tsconfig — после разовых
сборок (мутационных проверок, экспериментов) откатывать `git checkout -- tsconfig.json`.

Новый критерий из ROADMAP сначала становится тестом, потом кодом.

## Деплой

`main` → превью Vercel (`SITE_ENV=preview`, noindex). Боевой mrshkn.com живет на VPS с Coolify,
туда сайт переезжает отдельным блоком роадмапа. Секреты — только в секретах хостинга.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
