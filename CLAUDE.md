# CLAUDE.md — site (сайт студии MRSHKN)

Репозиторий сайта mrshkn.com. Решения студии — `../PLAN.md`; порядок работ и критерии приемки — `../ROADMAP.md`;
артборды направлений — `../design/*.dc.html`.

## Стек

Next.js 16 (App Router, Turbopack, `proxy.ts` вместо `middleware.ts`), React 19, TypeScript, SCSS-модули,
next-intl 4 (ru/en), next-themes, Payload 3 на Postgres. Пакетный менеджер — Yarn 4 через corepack.
Пакет — ESM (`"type": "module"`, как в шаблоне Payload): иначе CLI Payload грузит конфиг как CommonJS и падает
на `@payloadcms/richtext-lexical`. Поэтому в тестах `import.meta.dirname` вместо `__dirname`.

## Структура

```
src/app/[locale]/    layout (html, метаданные, провайдеры, Header и Footer направления, пилюля) и страницы (главная, work/[slug], brief)
src/app/(payload)/   админка `/admin` и REST `/api/*` Payload — файлы генерирует Payload, руками не правятся
src/cms/             коллекции, глобал настроек, права, чтение данных для страниц (getCases, hasCases, getCaseBySlug)
src/migrations/      миграции схемы Payload — генерирует `yarn payload migrate:create`
src/designs/         реестр направлений: consts, types, registry (next/dynamic), resolve, server (cookie)
src/designs/<name>/  index (клиентский модуль-чанк), fonts (next/font), Header, Hero, Pricing, Works, Process, Case, Footer + SCSS-модули
src/components/      общие компоненты вне направлений: DesignSwitcher, ThemeToggle, LocaleSwitcher, icons
src/content/         контент, общий для всех направлений: pricing (цены), format, use-price, types
src/i18n/            routing, request, navigation, consts
src/lib/             окружение сборки и общие константы
src/styles/          globals.scss (база) и designs/<name>.scss (токены направления)
messages/            ru.json, en.json, TRANSLATION-TODO.md
tests/unit/          Vitest
tests/integration/   Vitest на Postgres: Payload целиком, с правами и миграциями
tests/e2e/           Playwright + эталоны скриншотов (*-snapshots/)
```

## Локальная база и Payload

- Postgres 18 из `docker-compose.yml` на `127.0.0.1:5434` (как `site-postgres` на сервере; порт не 5432 и не 5433 —
  там базы других проектов). Две базы: `site` — разработка, `site_test` — интеграционные тесты.
- Переменные — `DATABASE_URI` и `PAYLOAD_SECRET` в `.env`, образец — `.env.example`.
- Сборке база не нужна: админка и REST рендерятся на запрос → CI собирает без нее.
- Схема: в разработке Payload накатывает ее сам (push). На сервере — миграции `src/migrations/`, их запускает
  при старте `prodMigrations`, но только с `MIGRATE_ON_START=true` (флаг задан в образе, `Dockerfile`). На базе
  разработки, созданной push, Payload спросил бы в терминале, можно ли терять данные → `yarn start` и Lighthouse
  идут без флага.
- Типы `src/payload-types.ts` — `yarn generate:types`; карта клиентских компонентов админки — `yarn generate:importmap`
  (после смены редактора или его возможностей).

## Две оси: тема и направление

Цветовая тема (`data-theme`, next-themes) и направление дизайна (`data-design`). Направлений пять: kinetic (дефолт),
terminal, pop, swiss, editorial. Все пять реализуют все секции, fallback на дефолтное направление нет.

## Соглашения

- Компоненты — стрелочные функции; тип пропсов `ComponentNameProps` через `type`.
- Константы и типы — в `consts.ts` и `types.ts`, не в файле компонента.
- SCSS без комментариев; медиазапросы только `max-width`; `hyphens: none`.
- Вне файлов токенов (`src/styles/designs/<name>.scss`) SCSS без литералов цветов, `font-family`, `border-radius`,
  `box-shadow` и толщин `border` — только `var(--…)`; проверяет `tests/unit/design-tokens.test.ts`.
- Текст из CMS и от бэкенда не вылезает из контейнера: `overflow-wrap: anywhere`, `min-width: 0`.
- Prettier: 120 символов, одинарные кавычки, точка с запятой, один атрибут на строку.
- «е» вместо «ё»; после «в», «к», «с», «на», «и» — неразрывный пробел.
- Английские тексты Claude пишет сам (решение Николая 20.09.2026, только для студии и ее проектов): новый ключ сразу
  в `ru.json` и `en.json` с живым английским, строка — в `messages/TRANSLATION-TODO.md`, таблица «ждет вычитки»;
  читает и правит Николай перед публикацией. Английский — текст для рынка, не подстрочник: российские реалии →
  международные (152-ФЗ → privacy policy, Метрика → GA4, ЮKassa → Stripe).
- Знак вне сабсета шрифтов направлений отрисуется fallback-начертанием → покрытие переводов проверяет
  `tests/unit/font-subset.test.ts`: новый символ в `messages/*.json` роняет тест, `GLYPHS` расширяется вместе с текстом.

## Запреты

- Новая ссылка в разметке — только на существующий адрес, иначе не добавлять: по решению D21 сайт выходит в сеть
  блоком B49, после того как все ссылки заработают.
- `src/app/(payload)/` генерирует Payload — руками не править.
- Поменял коллекцию, поле или глобал Payload → `yarn payload migrate:create <имя>` и коммит вместе с кодом:
  `tests/integration/migrations.test.ts` сравнивает схему конфига со снимком последней миграции и падает при расхождении.
- Порог Lighthouse — performance ≥ 90 и accessibility 100 у **каждого** из трех прогонов, не у лучшего — не ослаблять:
  это же обещание идет клиенту в договор.
- Секреты — только в секретах хостинга.
- Свой сертификат приложению не заводить: имя попало бы в журнал Certificate Transparency; есть общий wildcard
  `*.mrshkn.com`.
- `next build` в новый `NEXT_DIST_DIR` дописывает его `types/**` в `include` tsconfig → после разовых сборок
  (мутационных проверок, экспериментов) откатывать `git checkout -- tsconfig.json`.
- После обновления Payload проверить, что правило заголовков `withPayload` в `next.config.ts` не поменяло форму
  (`.claude/rules/cms.md`).

## Команды

- `yarn dev` — разработка; `yarn build` / `yarn start` — сборка и запуск.
- `yarn test` = `typecheck` + `lint` + `test:unit` + `test:integration` + `test:e2e` (`format:check` не входит —
  запускать отдельно).
- `yarn build:lighthouse` + `yarn test:lighthouse` — Lighthouse (`.claude/rules/lighthouse.md`).
- `yarn payload migrate:create <имя>`, `yarn generate:types`, `yarn generate:importmap` — раздел «Локальная база
  и Payload».

## Тесты

- Vitest (unit, `tests/unit/`) — логика без браузера и базы: реестр направлений, индексация по окружению, прайс
  и форматирование сумм, заявка, прокси языков, адрес записи CMS, тема; плюс проверки исходников — токены в SCSS,
  покрытие сабсетов шрифтов, `lighthouserc.cjs`.
- Интеграционные — `yarn test:integration` (`vitest.integration.config.ts`), Payload целиком на базе `site_test`.
  Перед прогоном схема стирается (защита — имя базы кончается на `_test`), медиатека тестов — во временном каталоге.
  Перед запуском — `docker compose up -d`; на CI базу дает сервис Postgres джоба.
- Playwright — реальные сборки: конфиг поднимает `preview` на 3100 и `production` на 3101 → разница по `SITE_ENV`
  проверяется на настоящем HTML, а не на моках. Главная читает CMS, поэтому перед сборкой `scripts/prepare-database.ts`
  стирает схему `site_test` и накатывает миграции; кейсов в базе нет → секции «Работы» и пункта меню в эталонах нет.
  Третий `webServer` — приемник заявок (`.claude/rules/brief.md`).
- Перед полным прогоном гасить серверы на 3100, 3101 и 3103. Адреса каналов заявки приезжают только из `LEAD_ENV` →
  сервер, поднятый руками (`yarn start -p 3100`), для тестов заявки не годится: `reuseExistingServer` его подхватит,
  и заявка получит 502.
- Lighthouse CI — `scripts/lighthouse.mjs`, по прогону на направление, главная и страница засеянного кейса
  (`.claude/rules/lighthouse.md`).
- Эталоны `toHaveScreenshot` (`tests/e2e/*-snapshots/*-darwin.png`) сняты на macOS и сравниваются только на macOS:
  на Linux-раннере CI визуальный describe пропускается, структурные проверки шапки, hero и подвала идут везде.
  На время снимка пилюля переключателя скрыта (`tests/e2e/screenshot.css`).
- Обновить эталоны после осознанного изменения верстки: `yarn test:e2e design-shell --update-snapshots`, диф эталонов
  смотреть глазами. Изменение высоты секции выше сдвигает подвал на доли пикселя → его эталон тоже переснимать.

### Новых e2e не пишем (D37)

Решение Николая от 27.09.2026 (D37 в `../PLAN.md`): e2e съедают много времени и токенов. e2e — все, что поднимает
приложение и ходит в него браузером или по HTTP: Playwright из `tests/e2e/` и любые запросы к запущенному серверу.
Действует в каждом блоке, начатом после решения; блок, бывший в работе, когда D37 приняли, доводится по своим
критериям, как они записаны в `../ROADMAP.md`.

- **Авто-пункт ROADMAP** закрывается тем, что записано в критерии: unit или интеграционным тестом, Lighthouse CI,
  строкой в параметрическом списке, прогоном готовых спеков. Новый тест — только unit или интеграционный: чистые
  функции; компоненты, отрисованные в строку (`renderToStaticMarkup`); обработчик маршрута, вызванный напрямую
  с `new Request(…)`; Payload Local API на `site_test`. Порядок прежний: критерий сначала становится тестом и падает
  (RED), потом пишется код. Unit-конфиг сейчас берет только `tests/unit/**/*.test.ts` — первый тест компонента
  в `.tsx` расширяет `include`.
- **Новый файл в `tests/e2e/` или новый `test(…)` в готовом спеке** — нарушение D37 (кроме смоука нового потока, ниже),
  даже если критерий записан как e2e: такой критерий — вопрос к `/mrshkn-plan`, а не повод писать спек.
- **Смоук нового потока — единственное исключение (D37 изменен 01.10.2026).** Новый обработчик или флоу, через который
  человек оставляет контакт, записывается или платит, получает один e2e «счастливый путь» — только если в критериях
  блока есть пункт «smoke e2e (D37, новый поток)». Один тест на поток, на локальной сборке в CI: от входа на страницу
  до записи в CMS или в локальном приемнике. Telegram, MAX, почта, ЮKassa и Radario — заглушки по образцу
  `tests/e2e/lead-sink.ts`: секретов и чужой сети в CI нет. Отказы (нет согласия, ловушка, чужая подпись, повтор) смоук
  не проверяет — их закрывают интеграционные тесты. Кнопка или страница, ведущая в уже покрытый путь, — не новый поток:
  ее закрывает строка в списке или пункт «(Claude, <способ>)». У сайта поток квиза уже покрыт `tests/e2e/brief.spec.ts`;
  ежедневная контрольная заявка на боевом — не e2e в CI, а workflow по расписанию с интеграционным тестом обработчика.
- **Готовые спеки остаются** в `yarn test` и на CI. Код их сломал — чинится код; ожидание меняется, только если
  поведение поменялось по критерию блока. Удалять, скипать и ослаблять тест нельзя. Пересъемка эталонов скриншотов
  после осознанной правки верстки — починка, а не новый тест.
- **Параметрический спек принимает новую страницу строкой в своем списке** — это не новый тест. У сайта таких списков
  два: `INNER_PAGES` в `tests/e2e/links.spec.ts` (обход ссылок шапки и подвала) и `PAGES` в `tests/e2e/headers.spec.ts`
  (страницы без подсказок клиента `Critical-CH` и `Accept-CH`).
- **Пункт «(Claude, <способ>)»** в критериях — «(Claude, браузер)», «(Claude, curl)», «(Claude, разовый скрипт)»,
  «(Claude, CLI)» и подобные — Claude проверяет и закрывает сам, без подтверждения Николая; спек после проверки
  в репозитории не остается. «(Claude, браузер)» — страница целиком в браузере (Playwright MCP, chrome-devtools MCP)
  или разовым скриптом вне репозитория, на сборке, названной в пункте (dev, локальная production-сборка, stage).
  Свидетельство в `../ROADMAP.md` — одной строкой: команда или адрес и сборка; для браузера — ширины, темы, направления
  и языки; что увидено или измерено; дата; найденный дефект — что нашлось и чем исправлено.
- Lighthouse CI остается (D4, D28, D29).

## Деплой

- `main` уезжает на закрытый стенд Coolify (`stage.mrshkn.com`, basic-auth) с `SITE_ENV=preview`, то есть noindex.
  Других превью нет, у pull request'ов своих адресов тоже нет. Боевой mrshkn.com включается отдельным блоком
  роадмапа — своим приложением в Coolify со своей базой.
- Сервер образы не собирает (D41). Пуш в `main` → джоб `image` в `ci.yml` после зеленого `checks` (Lighthouse не ждет)
  собирает `Dockerfile` с `SITE_ENV=preview` и `NEXT_PUBLIC_SITE_URL=https://stage.mrshkn.com`, кладет
  `ghcr.io/nikolaymurashkin/mrshkn-site:<sha коммита>` (пакет приватный) → через API Coolify ставит этот тег
  приложению и выкатывает, ждет `finished`. Красный `checks` до стенда не доходит; упал выкат — красный джоб.
- Coolify — `https://coolify.mrshkn.com`, проект `mrshkn-site`, окружение `stage`, приложение типа Docker Image (UUID —
  переменная репозитория `COOLIFY_APP_UUID`, токен API — секрет `COOLIFY_TOKEN`). Сервер тянет образ из `ghcr.io`
  под своим `docker login`. Coolify запускает новый контейнер и сразу снимает старый; проверка здоровья выключена →
  несколько секунд адрес может отдать 502. Откат — Coolify → приложение → Rollback (хранит 2 образа) или новый тег
  в General → Docker Image Tag и Deploy.
- Порядок работы с сервером — `../docs/ops/vps-setup.md` и `../docs/ops/coolify.md`.

## Карта тем

Правила из `.claude/rules/` грузятся сами, когда читаешь файл под их `paths:`. Задача без чтения таких файлов
(Coolify через MCP, ревью, планирование) — нужное прочитать вручную.

- `.claude/rules/designs.md` — реестр `next/dynamic`, секции, переключатель, тема и cookie, токены, якоря шапки.
  Читать перед правкой секций направления, переключателя, темы, токенов, шапки.
- `.claude/rules/fonts.md` — next/font без preload, свои сабсеты всех пяти направлений, метрические fallback-начертания. Читать перед
  сменой шрифта, пересборкой сабсетов, правкой fallback.
- `.claude/rules/pricing.md` — цены, форматирование сумм, блоки под тарифами, ссылки тарифов. Читать перед правкой
  цен, тарифов, опций, секции «Услуги и цены».
- `.claude/rules/brief.md` — квиз, `POST /api/brief`, каналы доставки, метки, ловушка, приемник заявок в e2e. Читать
  перед правкой квиза, заявки, каналов доставки.
- `.claude/rules/cms.md` — Payload: коллекции, роли и доступ, чтение на страницах, заголовки `withPayload`. Читать
  перед правкой CMS, доступа, `next.config.ts`, обновлением Payload.
- `.claude/rules/lighthouse.md` — запуск Lighthouse CI, порог `pessimistic`, прогрев. Читать перед правкой конфига
  Lighthouse, CI, разбором упавшего замера.
- `.claude/rules/deploy.md` — образ standalone, переменные сборки и работы, тома Coolify. Читать перед правкой образа,
  работой со стендом и Coolify.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
