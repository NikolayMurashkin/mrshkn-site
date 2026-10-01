---
paths:
  - "lighthouserc.cjs"
  - "scripts/lighthouse.mjs"
  - "tests/unit/lighthouse-config.test.ts"
  - ".github/workflows/**"
---

# Lighthouse CI

- `scripts/lighthouse.mjs` гоняет `lhci autorun` пять раз — по одному на направление. Cookie `design` задается через
  `LIGHTHOUSE_DESIGN` в `lighthouserc.cjs`, отчеты — в `.lighthouseci/<design>/`.
- Сборка production — с `NEXT_PUBLIC_SITE_URL`, совпадающим с адресом сервера, иначе canonical указывает на чужой origin
  и SEO-аудит падает.
- Порог — `aggregationMethod: 'pessimistic'`: у каждого из трех прогонов, не у лучшего (так LHCI считает по умолчанию).
  Числа и запрет ослаблять — в `CLAUDE.md`.
- Перед пятью замерами скрипт делает один прогревочный `lhci collect` и выбрасывает результат: первый Lighthouse на свежем
  раннере GitHub стабильно давал TBT 430–540 мс против 95–160 у всех следующих (холодный Chrome и Node, benchmarkIndex
  ниже) — свойство раннера, не сайта.
- `tests/unit/lighthouse-config.test.ts` держит конфиг от случайного отката.
