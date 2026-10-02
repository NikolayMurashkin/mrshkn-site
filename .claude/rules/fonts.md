---
paths:
  - 'src/designs/*/fonts.ts'
  - 'src/designs/*/fonts/**'
  - 'src/designs/*/index.tsx'
  - 'src/styles/designs/**'
  - 'scripts/subset-*'
  - 'tests/unit/font-subset.test.ts'
---

# Шрифты направлений

- `src/designs/<name>/fonts.ts`, через `next/font/local` с `display: swap` и `preload: false`. Модуль подключается из `index.tsx`
  как `import './fonts'` ради `@font-face`; токены ссылаются на семейства по имени (`'Unbounded', 'Unbounded Metric Fallback', …`)
  → `@font-face` едут в CSS-чанк направления, а не в общий CSS.
- Константы в `fonts.ts` никто не импортирует: next/font требует `const` на уровне модуля, а неиспользуемую константу
  без `export` ESLint отметит предупреждением — `export` только ради этого.
- Preload включать нельзя: манифест шрифтов у Next на entry, подсказки preload уходят всем направлениям сразу (по замеру
  это роняло Lighthouse чужих направлений до 78–89); без preload все пять держат 93–98.
- Имя семейства в `@font-face` задается через `declarations: [{ prop: 'font-family', … }]` — Turbopack это уважает,
  иначе семейство называлось бы по имени константы.

## Свои сабсеты всех пяти направлений

- Не Google, а свои сабсеты через `next/font/local`: `src/designs/<name>/fonts/*.woff2`, рядом `*-OFL.txt`. Один вариативный
  файл на семейство, `wght` сужен до начертаний сайта: Unbounded 700–900, Golos Text 400–600, JetBrains Mono 400–700,
  IBM Plex Sans 400–700, Rubik 500–900, Geologica 300–800, Onest 400–600; Prata — статичный. Прочие оси исходника
  зафиксированы по умолчанию из `fvar` (IBM Plex Sans `wdth` 100; Geologica `CRSV` 0, `SHRP` 0, `slnt` 0), курсивов нет.
  Только базовая латиница, кириллица U+0400–045F и пунктуация. Знаки, которых нет в исходнике (✓, ✦, стрелки у Rubik
  и Prata и др.), не добавляем: их рисует fallback, как и с Google (список — `tests/unit/font-subset.test.ts`).
- Почему не Google: `next build` качал шрифты из сети и падал на CI (D38). У Kinetic еще и скорость: файлы Google
  (4 файла, 140 КБ на `/ru`) давали FCP 2,0 с и LCP 3,0 с против 1,2–1,7 с у остальных — в симуляции Lighthouse все байты,
  доехавшие до наблюдаемого LCP, входят в его оценку. Сабсеты (57 КБ) дают 99 локально и запас на раннере.
- Пересобрать: `node scripts/subset-fonts.mjs` — качает исходники из `google/fonts` по закрепленному коммиту и режет
  `subset-font` (harfbuzz в wasm). Вывод детерминированный: повторный запуск дает побайтно те же файлы.
- Набор символов — `scripts/subset-glyphs.ts` (Node 24 импортирует `.ts` напрямую, стирая типы → ExperimentalWarning
  при запуске). Невидимые знаки собираются из кодов: Prettier разворачивает `\uXXXX` обратно в символы, а литеральный
  неразрывный пробел в дифе не виден.
- Покрытие переводов сабсетом — `tests/unit/font-subset.test.ts`, правило — в `CLAUDE.md`.

## Метрические fallback-начертания

- `'<Family> Metric Fallback'` объявлены руками в файле токенов. Почему: собственный fallback next/font (`'<Family> Fallback'`)
  ссылается только на `local(Arial)`, которого нет на Linux и Android — там текст до загрузки шрифта был на четверть уже
  и прыгал (CLS 0,12–0,47, Lighthouse на CI 88).
- Наши начертания перечисляют `local('Arial'), local('Liberation Sans'), local('Roboto')`; `ascent/descent/size-adjust`
  скопированы из начертания next/font в CSS-чанке (оттуда же брать при смене шрифта).
- Имя нарочно не совпадает с next/font'овским: `adjustFontFallback: false` в Turbopack (Next 16.3.5) не действует,
  `@font-face '<Family> Fallback'` с `local(Arial)` все равно лежит в чанке, и при одинаковом имени выбор начертания
  зависел бы от порядка `<link>` и того, пропустит ли браузер начертание с неразрешимым `local()`.
