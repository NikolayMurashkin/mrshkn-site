# Английские тексты: что написано и что ждет вычитки

**Правило изменено 20.09.2026 (решение Николая).** Раньше Claude английские тексты не писал и
клал в `en.json` русские заглушки. Теперь для сайта студии и ее собственных проектов Claude пишет
английский сам, а Николай вычитывает перед публикацией. Для рабочих (банковских) проектов старое
правило в силе: перевода нет — русская заглушка.

## Ждет вычитки Николая

Написано Claude 20.09.2026, смысл сверен с бизнес-планом, но носителем языка не проверялось:

| Раздел              | Что внутри                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `pricing.*`         | вся секция «Услуги и цены»: тарифы, что входит в тариф, опции, Dev-подписка                  |
| `pricing.plans.*`   | названия продуктов: Landing page, Business website, Telegram Mini App, Startup MVP           |
| `pricing.basics.*`  | база тарифа; RU-специфика заменена на международную (152-ФЗ → privacy policy, Метрика → GA4) |
| `pricing.options.*` | опции; онлайн-оплата в EN — Stripe на аккаунте клиента, не ЮKassa                            |
| `process.*`         | таймлайн «как проходят две недели» и четыре обещания D4                                      |

## Еще русские заглушки (ждут перевода)

Ключи из B7, к которым Claude не возвращался: `controls.theme`, `nav.*`, `header.cta`,
`header.kicker`, `header.location`, `header.founded`, `hero.*.lead`, `hero.*.primaryCta`,
`hero.*.secondaryCta`, `hero.kinetic.badge`, `hero.kinetic.ticker.*`, `hero.terminal.logTitle`,
`hero.terminal.day`, `hero.terminal.log.*`, `hero.terminal.status.active`, `hero.pop.stickers.*`,
`hero.swiss.sectionMark`, `hero.editorial.quote*`, `switcher.label`, `footer.heading`,
`footer.headingQuestion`, `footer.invitation`, `footer.telegram`, `footer.replyTime`,
`footer.sectionMark`.

По-английски в `en.json` с самого начала: `meta.*`, `hero.subtitle` и `hero.*.title` — они собраны
из утвержденной в бизнес-плане фразы «Custom-coded websites in 14 days. Fixed price, no templates,
support included.»

Правило на будущее: новый ключ появляется сразу в `ru.json` и `en.json`; английский текст пишется
сразу, а строка попадает в таблицу «ждет вычитки», пока Николай ее не прочитал.
