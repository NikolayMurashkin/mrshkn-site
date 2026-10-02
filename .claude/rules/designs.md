---
paths:
  - 'src/designs/**'
  - 'src/styles/**'
  - 'src/components/DesignSwitcher*'
  - 'src/components/Theme*'
  - 'src/components/theme-*'
  - 'src/app/*/layout.tsx'
  - 'src/app/*/page.tsx'
  - 'tests/unit/design-tokens.test.ts'
  - 'tests/unit/registry.test.ts'
  - 'tests/unit/theme-storage.test.ts'
  - 'tests/e2e/design-*'
  - 'tests/e2e/links.spec.ts'
---

# Направления и тема

## Реестр и секции

- Секции направления — клиентские компоненты. Один модуль-чанк на направление: `src/designs/<name>/index.tsx`
  (`'use client'`), отдает `<Name>Section({ section })`, подключает шрифты направления (`import './fonts'`).
- Реестр `src/designs/registry.tsx` заводит на каждый модуль `next/dynamic(() => import('./<name>'))`. Литеральный
  `import()` внутри `dynamic()` обязателен: по нему Next кладет в SSR-HTML `<link rel="stylesheet" data-precedence="dynamic">`
  ровно с CSS этого направления; серверный `import()` так не умеет — Turbopack линкует все чанки разом.
- Layout и страница рендерят `<DesignSection design section={…} />`. Имена секций — `SECTION_NAMES` (`src/designs/consts.ts`):
  `header` и `footer` в layout; `hero`, `pricing`, `works`, `process` на главной (`works` — только если кейсы есть);
  `case` — страница `/[locale]/work/[slug]`. Секции с данными принимают их пропсами (`SectionProps` — объединение по
  `section`: `hasCases` у шапки, `cases` у `works`, `caseItem` у `case`): CMS читают серверные страницы и layout,
  клиентский чанк только рисует. Выбор компонента по имени секции — `renderSection` (`render.ts`), в `index.tsx`
  направления остается таблица `DesignComponents`. Внутри — `createElement(...)`: JSX-тег
  из переменной ловит `react-hooks/static-components`.
- `dynamic()` вызывается без `loading`: так у него нет своей Suspense-границы, подвисший чанк всплывает до уже видимой
  границы layout, и React при `router.refresh()` не коммитит новое направление, пока чанк не доехал → секции появляются
  вместе с `data-design`, без пустого кадра (проверяет e2e «секции нового направления появляются вместе с его атрибутом»).
  Добавить `loading` — вернуть пустой кадр.
- Направление на сервере читает `getDesign()` из `src/designs/server.ts` (cookie `design`; неизвестное значение → дефолт
  через `resolveDesign` из `resolve.ts`, он без `'use client'`).

## Переключатель и тема

- `src/components/DesignSwitcher.tsx` — пилюля «Стиль: …» внизу справа. Пишет cookie на клиенте, делает `router.refresh()`
  (soft: скролл и состояние на месте), оборачивает коммит в `document.startViewTransition` и ждет его через
  `useLayoutEffect` по пропу `design`. Чанк выбранного направления подгружает `preloadDesign` параллельно с refresh.
- Тема по умолчанию у направления своя (`DESIGN_DEFAULT_THEME`: Kinetic и Terminal темные, остальные светлые, как
  на артбордах). Пользователь тему не выбирал (`localStorage.theme` пуст) → при смене направления тема переключается
  на дефолт нового направления и снова не считается выбранной.
- Источник истины выбранной темы — localStorage (next-themes). `ThemeCookieSync` внутри `ThemeProvider` зеркалит ее
  в cookie `theme` при загрузке и при каждой смене (только когда тема действительно выбрана).
- Cookie нужна серверу: `getTheme()` из `src/components/theme-server.ts` рендерит `data-theme` на `<html>`. Иначе
  `router.refresh()` при смене направления перетирал бы тему, выставленную next-themes в DOM, дефолтом нового направления,
  а полная навигация (смена языка) отдавала бы дефолт, который скрипт next-themes тут же менял на сохраненный.
  Побочный плюс: у вернувшегося пользователя тема совпадает с SSR, мигания нет.

## Токены

- `src/styles/designs/<name>.scss`: блок `[data-design='<name>']` (светлая тема, шрифты, радиусы, толщины рамок, тени)
  и `[data-design='<name>'][data-theme='dark']` (цвета темной темы).
- Общий контракт — список `REQUIRED_TOKENS` в `tests/unit/design-tokens.test.ts`; направление может добавлять свои
  (`--ok`, `--accent-alt`, `--radius-round`). Запрет литералов вне файлов токенов — в `CLAUDE.md`, проверяет тот же тест.

## Якоря шапки

- Абсолютные `/<locale>#<секция>`, а не `#<секция>`: шапка рендерится на каждой странице, а секции с этими `id` — только
  на главной; относительный якорь мертв везде, кроме нее.
- `id` секций: `services` и `prices` в `Pricing.tsx`, `work` в `Works.tsx`, `process` в `Process.tsx`, `contacts`
  в `Footer.tsx`. Пункт «Кейсы» (`/<locale>#work`, между «Услугами» и «Ценами») шапка показывает только при `hasCases`
  (`visibleNavItems`): секции без кейсов нет, и ссылка вела бы в никуда (D21).
- Проверку держит `tests/e2e/links.spec.ts`: ищет якорь локатором в DOM той страницы, куда ведет ссылка. Подстрокой
  в HTML искать нельзя — `data-testid="process"` содержит `id="process"`.
