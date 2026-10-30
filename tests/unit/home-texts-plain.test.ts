import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

type Entry = { path: string; text: string };

/**
 * Тексты главной, квиза, «спасибо», шапки, меню, подвала, баннера cookie, страницы «Работы» и формы отзыва,
 * выбранные Николаем после чтения глазами новичка, и те же обещания скорости в чужих ключах — дословно.
 * Неразрывный пробел — escape `\u00a0`, обычный — обычный. Индекс массива — число в пути.
 */
const APPROVED_RU: [string, string][] = [
  ['header.kicker', 'Делаем сайты и\u00a0приложения'],
  ['header.status', 'на\u00a0связи'],
  ['header.location', 'Калининград, работаем онлайн'],
  ['header.cta', 'Обсудить сайт'],
  ['nav.work', 'Работы'],
  ['nav.process', 'Как работаем'],
  ['controls.theme', 'Светлый или темный фон'],
  ['hero.kinetic.primaryCta', 'Узнать цену сайта'],
  ['hero.pop.primaryCta', 'Узнать цену сайта'],
  ['hero.swiss.primaryCta', 'Узнать цену сайта'],
  ['hero.editorial.primaryCta', 'Узнать цену сайта'],
  ['hero.kinetic.tapeCode', 'Код сайта передаем вам'],
  ['hero.kinetic.ticker.landing', 'Сайты из\u00a0одной страницы'],
  ['hero.kinetic.ticker.miniApps', 'Приложения в\u00a0Telegram'],
  ['hero.kinetic.ticker.mvp', 'Первые версии продуктов для\u00a0стартапов'],
  ['hero.kinetic.ticker.support', 'Поддержка сайтов после запуска'],
  ['hero.terminal.status.ok', 'готово'],
  ['hero.editorial.refDeadline', '— Фиксируем в\u00a0договоре: срок'],
  ['hero.editorial.refQuality', '— Фиксируем в\u00a0договоре: скорость'],
  ['hero.editorial.refWarranty', '— Фиксируем в\u00a0договоре: год гарантии'],
  ['work.heading', 'Работы'],
  ['work.back', 'Все работы'],
  ['work.pageTitle', 'Работы\u00a0— MRSHKN'],
  [
    'work.note',
    'Результаты показываем цифрами, которые можно проверить самим,\u00a0— например, баллы теста скорости Google. Примеры студии мы сделали сами, для\u00a0показа,\u00a0— это не\u00a0заказы клиентов.',
  ],
  ['work.kind.demo', 'Пример студии'],
  ['work.demoLink', 'Открыть пример сайта'],
  ['work.appLink', 'Открыть приложение в\u00a0Telegram'],
  ['work.stack', 'На\u00a0чем сделан сайт'],
  ['work.results', 'Результаты в\u00a0цифрах'],
  ['work.lighthouse', 'Снимок экрана: тест скорости Google (Lighthouse)'],
  ['work.design', 'Стиль сайта: {design}'],
  ['work.metaDescription', '{title}: что сделала студия MRSHKN, на\u00a0чем и\u00a0какие результаты в\u00a0цифрах.'],
  [
    'work.pageDescription',
    'Работы студии MRSHKN: что сделали, на\u00a0чем и\u00a0какие результаты в\u00a0цифрах\u00a0— например, баллы теста скорости Google. Примеры студии сделаны для\u00a0показа, это не\u00a0заказы клиентов.',
  ],
  ['process.sectionMark', 'Как работаем'],
  ['process.stepLabel', 'шаг {index}/04 · день {day}'],
  ['process.promises.price.value', 'Фиксированная'],
  [
    'process.promises.price.detail',
    'Платите частями: 30\u00a0%, 40\u00a0% и\u00a030\u00a0%. Три раунда правок\u00a0— три раза присылаете замечания, каждый раз одним списком',
  ],
  ['process.promises.quality.value', 'Скорость от\u00a090 из\u00a0100'],
  [
    'process.promises.quality.detail',
    'В\u00a0тесте скорости Google на\u00a0телефоне\u00a0— в\u00a0каждом из\u00a0трех замеров подряд. Не\u00a0набрали из-за нашего кода или настройки хостинга\u00a0— дорабатываем бесплатно, акт присылаем только после 90. Если на\u00a0сайте окошко другого сервиса\u00a0— онлайн-запись, карта,\u00a0— сколько баллов обещаем, скажем заранее.',
  ],
  ['process.after.speed.title', 'Скорость сайта'],
  [
    'process.after.speed.text',
    'В\u00a0день запуска еще раз проверяем скорость тестом Google, уже на\u00a0вашем адресе: нужно 90\u00a0баллов из\u00a0100\u00a0или больше в\u00a0каждом из\u00a0трех замеров подряд. Результат прикладываем к\u00a0акту приемки\u00a0— документу, что работа принята. Меньше 90\u00a0из-за нашего кода или из-за того, как мы настроили хостинг\u00a0— сервер, на\u00a0котором работает сайт,\u00a0— дорабатываем бесплатно и\u00a0не\u00a0сдаем работу, пока не\u00a0будет 90. Если причина не\u00a0в\u00a0нас\u00a0— авария у\u00a0хостинга или код, который вы добавили сами,\u00a0— покажем ее письмом с\u00a0отчетами теста. Не\u00a0возразили за\u00a02 рабочих дня\u00a0— запишем причину в\u00a0акт и\u00a0сдадим работу. Не\u00a0согласны\u00a0— повторим замер в\u00a0согласованное время и\u00a0запишем экран; ваш замер в\u00a0то же время с\u00a0записью экрана тоже учтем. Нет доступа к\u00a0домену больше 10 рабочих дней\u00a0— сдаем работу на\u00a0временной ссылке, скорость меряем после переноса и\u00a0при\u00a0необходимости чиним по\u00a0гарантии. Чужой виджет\u00a0— окошко другого сервиса, например онлайн-записи или карты,\u00a0— замедляет страницы. Если вы его попросили, до\u00a0договора скажем, сколько баллов обещаем с\u00a0ним; попросите позже\u00a0— скажем до\u00a0того, как ставить.',
  ],
  ['process.after.acceptance.title', 'Как вы принимаете работу'],
  ['process.after.upkeep.title', 'Обновления и\u00a0запасные копии сайта'],
  [
    'brief.lead',
    'Пять коротких шагов, минуты две. Ответим в\u00a0течение часа, если пишете в\u00a0рабочие дни с\u00a010 до\u00a019 по\u00a0Москве (с\u00a09 до\u00a018 по\u00a0Калининграду).',
  ],
  [
    'brief.steps.product.note',
    'Выберите вариант, который ближе всего к\u00a0тому, что вам нужно. Детали уточним в\u00a0переписке.',
  ],
  [
    'brief.steps.niche.note',
    'От\u00a0сферы зависит, какие разделы нужны сайту и\u00a0какой наш готовый пример сайта взять за\u00a0основу.',
  ],
  [
    'brief.steps.design.note',
    'Стиль\u00a0— это внешний вид сайта: цвета, шрифты, форма кнопок. Выбор не\u00a0окончательный: в\u00a0переписке предложим варианты под\u00a0вашу задачу.',
  ],
  ['brief.designs.any', 'Выберите за\u00a0меня'],
  [
    'brief.steps.scope.note',
    'Выберите, что ближе всего: по\u00a0сроку и\u00a0бюджету поймем, какой тариф вам подойдет.',
  ],
  [
    'brief.steps.contacts.note',
    'Отвечаем в\u00a0течение часа в\u00a0рабочие дни с\u00a010 до\u00a019 по\u00a0Москве (с\u00a09 до\u00a018 по\u00a0Калининграду): уточним детали и\u00a0скажем, когда пришлем расчет.',
  ],
  [
    'brief.consent',
    'Согласен на\u00a0обработку персональных данных по\u00a0<policy>политике обработки персональных данных</policy>',
  ],
  [
    'brief.meta.description',
    'Пять коротких шагов: что нужно, сфера, стиль, сроки и\u00a0бюджет. Ответим в\u00a0течение часа в\u00a0рабочие дни с\u00a09 до\u00a018 по\u00a0Калининграду.',
  ],
  [
    'briefThanks.meta.description',
    'Заявка ушла в\u00a0студию MRSHKN. Ответим в\u00a0течение часа в\u00a0рабочие дни с\u00a09 до\u00a018 по\u00a0Калининграду.',
  ],
  ['briefThanks.command', './отправить-заявку'],
  [
    'briefThanks.note',
    'Если в\u00a0рабочее время прошло больше часа, а\u00a0ответа нет, напишите на\u00a0hello@mrshkn.com\u00a0— проверим, дошла ли заявка.',
  ],
  ['footer.heading', 'Обсудить сайт'],
  ['footer.headingQuestion', 'Обсудим ваш сайт?'],
  ['footer.privacy', 'Политика обработки персональных данных'],
  [
    'cookieBanner.text',
    'Яндекс Метрика и\u00a0Google Analytics 4 считают посещения сайта и\u00a0для\u00a0этого сохраняют в\u00a0вашем браузере cookie\u00a0— маленькие файлы. Включим их, только если вы согласны. Подробнее\u00a0— в\u00a0<policy>политике обработки персональных данных</policy>.',
  ],
  [
    'review.groups.author.note',
    'Фамилия, имя и\u00a0отчество нужны только для\u00a0согласия в\u00a0конце формы\u00a0— на\u00a0сайте их не\u00a0будет. Рядом с\u00a0отзывом все увидят подпись, ваше дело (например, «кофейня») и\u00a0ссылку, если вы ее дадите. Отзыв стоит и\u00a0на\u00a0странице работы, которую мы сделали для\u00a0вас, поэтому по\u00a0нему вас могут узнать.',
  ],
  ['review.groups.documents.title', 'Согласие и\u00a0разрешение на\u00a0публикацию'],
  [
    'review.groups.documents.note',
    'Отзыв уйдет, только когда стоят обе галочки внизу: первая\u00a0— согласие показать на\u00a0сайте подпись, дело, ссылку и\u00a0текст отзыва, вторая\u00a0— разрешение как автору опубликовать сам текст. Передумаете\u00a0— напишите на\u00a0hello@mrshkn.com с\u00a0той почты, что указали в\u00a0форме,\u00a0— снимем отзыв за\u00a03 рабочих дня.',
  ],
  [
    'review.linkError',
    'Вставьте ссылку целиком, как в\u00a0адресной строке браузера: она начинается с\u00a0https:// или http://',
  ],
  ['review.documents.edition', 'Версия документа: {version}'],
  [
    'process.steps.staging.text',
    'Вносим правки второго раунда и\u00a0пробно проверяем скорость на\u00a0временной ссылке: тест Google ставит странице от\u00a00 до\u00a0100 баллов. Присылаем отчеты, вы вносите вторую оплату\u00a0— 40\u00a0%\u00a0— и\u00a0присылаете третий, последний список замечаний. Обязательные 90 баллов меряем в\u00a0день запуска, уже на\u00a0вашем адресе.',
  ],
  ['footer.invitation', 'Расскажите о\u00a0задаче\u00a0— в\u00a0рабочее время ответим в\u00a0течение часа.'],
  [
    'hero.editorial.quote',
    '«Срок сайта из\u00a0одной страницы\u00a0— четыре дня со\u00a0дня, когда вы выбрали стиль. Скорость\u00a0— 90 из\u00a0100 или больше в\u00a0бесплатном тесте Google (PageSpeed Insights) на\u00a0телефоне, в\u00a0каждом из\u00a0трех замеров подряд. Не\u00a0набрали из-за нас\u00a0— дорабатываем бесплатно и\u00a0не\u00a0сдаем, пока не\u00a0будет 90. Год гарантии.»',
  ],
  [
    'services.landing.after.speed.text',
    'В\u00a0день запуска еще раз проверяем скорость тестом Google, уже на\u00a0вашем адресе: нужно 90\u00a0баллов из\u00a0100\u00a0или больше в\u00a0каждом из\u00a0трех замеров подряд. Результат прикладываем к\u00a0акту приемки\u00a0— документу, что работа принята. Меньше 90\u00a0из-за нашего кода или из-за того, как мы настроили хостинг\u00a0— сервер, на\u00a0котором работает сайт,\u00a0— дорабатываем бесплатно и\u00a0не\u00a0сдаем работу, пока не\u00a0будет 90. Если причина не\u00a0в\u00a0нас\u00a0— авария у\u00a0хостинга или код, который вы добавили сами,\u00a0— покажем ее письмом с\u00a0отчетами теста. Не\u00a0возразили за\u00a02 рабочих дня\u00a0— запишем причину в\u00a0акт и\u00a0сдадим работу. Не\u00a0согласны\u00a0— повторим замер в\u00a0согласованное время и\u00a0запишем экран; ваш замер в\u00a0то же время с\u00a0записью экрана тоже учтем. Нет доступа к\u00a0домену больше 10 рабочих дней\u00a0— сдаем работу на\u00a0временной ссылке, скорость меряем после переноса и\u00a0при\u00a0необходимости чиним по\u00a0гарантии. Чужой виджет\u00a0— окошко другого сервиса, например онлайн-записи или карты,\u00a0— замедляет страницы. Если вы его попросили, до\u00a0договора скажем, сколько баллов обещаем с\u00a0ним; попросите позже\u00a0— скажем до\u00a0того, как ставить.',
  ],
  [
    'services.industry.after.speed.text',
    'В\u00a0день запуска еще раз проверяем скорость тестом Google, уже на\u00a0вашем адресе: нужно 90\u00a0баллов из\u00a0100\u00a0или больше в\u00a0каждом из\u00a0трех замеров подряд. Результат прикладываем к\u00a0акту приемки\u00a0— документу, что работа принята. Меньше 90\u00a0из-за нашего кода или из-за того, как мы настроили хостинг\u00a0— сервер, на\u00a0котором работает сайт,\u00a0— дорабатываем бесплатно и\u00a0не\u00a0сдаем работу, пока не\u00a0будет 90. Если причина не\u00a0в\u00a0нас\u00a0— авария у\u00a0хостинга или код, который вы добавили сами,\u00a0— покажем ее письмом с\u00a0отчетами теста. Не\u00a0возразили за\u00a02 рабочих дня\u00a0— запишем причину в\u00a0акт и\u00a0сдадим работу. Не\u00a0согласны\u00a0— повторим замер в\u00a0согласованное время и\u00a0запишем экран; ваш замер в\u00a0то же время с\u00a0записью экрана тоже учтем. Нет доступа к\u00a0домену больше 10 рабочих дней\u00a0— сдаем работу на\u00a0временной ссылке, скорость меряем после переноса и\u00a0при\u00a0необходимости чиним по\u00a0гарантии. Чужой виджет\u00a0— окошко другого сервиса, например онлайн-записи или карты,\u00a0— замедляет страницы. Если вы его попросили, до\u00a0договора скажем, сколько баллов обещаем с\u00a0ним; попросите позже\u00a0— скажем до\u00a0того, как ставить.',
  ],
  [
    'services.business.after.speed.text',
    'В\u00a0день запуска еще раз проверяем скорость тестом Google, уже на\u00a0вашем адресе: нужно 90\u00a0баллов из\u00a0100\u00a0или больше в\u00a0каждом из\u00a0трех замеров подряд. Результат прикладываем к\u00a0акту приемки\u00a0— документу, что работа принята. Меньше 90\u00a0из-за нашего кода или из-за того, как мы настроили хостинг\u00a0— сервер, на\u00a0котором работает сайт,\u00a0— дорабатываем бесплатно и\u00a0не\u00a0сдаем работу, пока не\u00a0будет 90. Если причина не\u00a0в\u00a0нас\u00a0— авария у\u00a0хостинга или код, который вы добавили сами,\u00a0— покажем ее письмом с\u00a0отчетами теста. Не\u00a0возразили за\u00a02 рабочих дня\u00a0— запишем причину в\u00a0акт и\u00a0сдадим работу. Не\u00a0согласны\u00a0— повторим замер в\u00a0согласованное время и\u00a0запишем экран; ваш замер в\u00a0то же время с\u00a0записью экрана тоже учтем. Нет доступа к\u00a0домену больше 10 рабочих дней\u00a0— сдаем работу на\u00a0временной ссылке, скорость меряем после переноса и\u00a0при\u00a0необходимости чиним по\u00a0гарантии. Чужой виджет\u00a0— окошко другого сервиса, например онлайн-записи или карты,\u00a0— замедляет страницы. Если вы его попросили, до\u00a0договора скажем, сколько баллов обещаем с\u00a0ним; попросите позже\u00a0— скажем до\u00a0того, как ставить.',
  ],
  [
    'services.store.after.speed.text',
    'Перед сдачей проверяем, быстро ли магазин открывается на\u00a0телефоне,\u00a0— тестом Google на\u00a0вашем адресе: нужно 90\u00a0баллов из\u00a0100\u00a0или больше в\u00a0каждом из\u00a0трех замеров подряд. Результат прикладываем к\u00a0акту приемки\u00a0— документу, что работа принята. Меньше 90\u00a0из-за нашего кода или из-за того, как мы настроили хостинг\u00a0— сервер, на\u00a0котором работает сайт,\u00a0— дорабатываем бесплатно и\u00a0не\u00a0сдаем работу, пока не\u00a0будет 90. Если причина не\u00a0в\u00a0нас\u00a0— авария у\u00a0хостинга или код, который вы добавили сами,\u00a0— покажем ее письмом с\u00a0отчетами теста. Не\u00a0возразили за\u00a02 рабочих дня\u00a0— запишем причину в\u00a0акт и\u00a0сдадим работу. Не\u00a0согласны\u00a0— повторим замер в\u00a0согласованное время и\u00a0запишем экран; ваш замер в\u00a0то же время с\u00a0записью экрана тоже учтем. Нет доступа к\u00a0домену больше 10 рабочих дней\u00a0— сдаем работу на\u00a0временной ссылке, скорость меряем после переноса и\u00a0при\u00a0необходимости чиним по\u00a0гарантии. Чужой виджет\u00a0— окошко другого сервиса, например чата,\u00a0— замедляет страницы. Если вы его попросили, до\u00a0договора скажем, сколько баллов обещаем с\u00a0ним; попросите позже\u00a0— скажем до\u00a0того, как ставить. Какие страницы меряем и\u00a0как считаем оплату и\u00a0карту доставки, пишем в\u00a0смете до\u00a0договора.',
  ],
  [
    'services.mvp.after.speed.text',
    'Перед сдачей проверяем, быстро ли сервис открывается на\u00a0телефоне,\u00a0— тестом Google на\u00a0страницах, записанных в\u00a0договоре: нужно 90\u00a0баллов из\u00a0100\u00a0или больше в\u00a0каждом из\u00a0трех замеров подряд. Результат прикладываем к\u00a0акту приемки\u00a0— документу, что работа принята. Меньше 90\u00a0из-за нашего кода или из-за того, как мы настроили хостинг\u00a0— сервер, на\u00a0котором работает сайт,\u00a0— дорабатываем бесплатно и\u00a0не\u00a0сдаем работу, пока не\u00a0будет 90. Если причина не\u00a0в\u00a0нас\u00a0— авария у\u00a0хостинга или код, который вы добавили сами,\u00a0— покажем ее письмом с\u00a0отчетами теста. Не\u00a0возразили за\u00a02 рабочих дня\u00a0— запишем причину в\u00a0акт и\u00a0сдадим работу. Не\u00a0согласны\u00a0— повторим замер в\u00a0согласованное время и\u00a0запишем экран; ваш замер в\u00a0то же время с\u00a0записью экрана тоже учтем. Нет доступа к\u00a0домену больше 10 рабочих дней\u00a0— сдаем работу на\u00a0временной ссылке, скорость меряем после переноса и\u00a0при\u00a0необходимости чиним по\u00a0гарантии. Чужой виджет\u00a0— окошко другого сервиса, например чата или карты,\u00a0— замедляет страницы. Если вы его попросили, до\u00a0договора скажем, сколько баллов обещаем с\u00a0ним; попросите позже\u00a0— скажем до\u00a0того, как ставить. Меряем страницы, которые открываются без входа: главную, вход, регистрацию. Кабинеты за\u00a0паролем тест Google не\u00a0открывает.',
  ],
  [
    'briefThanks.text',
    'Ответим в\u00a0течение часа в\u00a0рабочие дни с\u00a010 до\u00a019 по\u00a0Москве (с\u00a09 до\u00a018 по\u00a0Калининграду)\u00a0— на\u00a0той связи, которую вы оставили.',
  ],
  [
    'hero.terminal.lead',
    'Сайты и\u00a0приложения в\u00a0Telegram для бизнеса. Код и\u00a0пароли передаем вам, тест скорости\u00a0— в\u00a0акте приемки.',
  ],
  ['hero.terminal.log.lighthouse', 'пробный тест скорости Google, оплата\u00a040%, ваши правки: 3\u00a0из\u00a03'],
  [
    'hero.terminal.log.handover',
    'сайт на\u00a0вашем адресе, тест скорости 90+ для\u00a0акта, все пароли и\u00a0файлы\u00a0— вам, оплата\u00a030%',
  ],
  [
    'hero.subtitle',
    'Цена и\u00a0срок\u00a0— в\u00a0договоре. Ваш сайт наберет 90+ баллов из\u00a0100 в\u00a0бесплатном тесте скорости Google; не\u00a0наберет из-за нас\u00a0— доработаем бесплатно до\u00a0сдачи. Год гарантии. Сайт из\u00a0одной страницы\u00a0— за\u00a04\u00a0дня, для клиники или кофейни\u00a0— за\u00a07.',
  ],
  [
    'services.threeD.terms.items.4',
    'Тест скорости Google на\u00a0телефоне\u00a0— 90\u00a0баллов из\u00a0100 или больше в\u00a0каждом из\u00a0трех замеров подряд. Не\u00a0набрали из-за нас\u00a0— дорабатываем бесплатно и\u00a0не\u00a0сдаем, пока не\u00a0будет 90. У\u00a03D-лендинга проверяем саму страницу, в\u00a0день запуска\u00a0— на\u00a0вашем адресе. У\u00a03D-блока\u00a0— страницу со\u00a0сценой по\u00a0нашей временной ссылке. За\u00a0вес и\u00a0скорость самого блока отвечаем мы: сначала показываем картинку, сцену загружаем после. Скорость остальной страницы зависит от\u00a0кода вашего сайта. Результат\u00a0— к\u00a0акту приемки',
  ],
  [
    'pricing.basics.lighthouse',
    'Тест скорости Google на\u00a0телефоне\u00a0— 90 баллов из\u00a0100 или больше в\u00a0каждом из\u00a0трех замеров подряд. Не\u00a0набрали из-за нас\u00a0— дорабатываем бесплатно и\u00a0не\u00a0сдаем, пока не\u00a0будет 90. В\u00a0день запуска проверяем еще раз, уже на\u00a0вашем адресе: этот результат идет в\u00a0акт приемки. Чужие виджеты, например запись, карты или чат, замедляют сайт. Если вы их выбрали, до\u00a0договора скажем, сколько баллов обещаем',
  ],
  [
    'services.landing.process.2.text',
    'Вносим правки второго раунда и\u00a0пробно проверяем скорость на\u00a0временной ссылке: тест Google ставит странице от\u00a00 до\u00a0100 баллов. Присылаем отчеты, вы вносите вторую оплату\u00a0— 40\u00a0%\u00a0— и\u00a0присылаете третий, последний список замечаний. Обязательные 90 баллов меряем в\u00a0день запуска, уже на\u00a0вашем адресе.',
  ],
  [
    'services.threeD.after.speed.text',
    'В\u00a0день запуска проверяем скорость тестом Google на\u00a0телефоне. Тест ставит странице от\u00a00 до\u00a0100\u00a0баллов. Запускаем его три раза подряд, и\u00a0каждый раз нужно 90\u00a0или больше. У\u00a03D-лендинга проверяем его страницу на\u00a0вашем адресе. У\u00a03D-блока\u00a0— страницу со\u00a0сценой по\u00a0нашей временной ссылке: мы отвечаем за\u00a0скорость самого блока, а\u00a0скорость остальной страницы зависит от\u00a0того, как сделан ваш сайт. С\u00a03D-блоком ваша страница станет медленнее: до\u00a0договора замерим ее и\u00a0скажем, сколько баллов она потеряет. Меньше 90\u00a0из-за нашей работы\u00a0— дорабатываем бесплатно и\u00a0не\u00a0сдаем работу, пока не\u00a0будет 90. Если причина не\u00a0в\u00a0нас\u00a0— авария у\u00a0хостинга или код, который вы добавили сами,\u00a0— покажем ее письмом с\u00a0отчетами теста. Не\u00a0возразили за\u00a02 рабочих дня\u00a0— запишем причину в\u00a0акт и\u00a0сдадим работу. Не\u00a0согласны\u00a0— повторим замер в\u00a0согласованное время и\u00a0запишем экран; ваш замер в\u00a0то же время с\u00a0записью экрана тоже учтем. Результат прикладываем к\u00a0акту приемки.',
  ],
];

/** Английские тексты тех же ключей — перевод утвержденного ru. */
const APPROVED_EN: [string, string][] = [
  ['header.kicker', 'We build websites and apps'],
  ['header.status', 'available'],
  ['header.location', 'Kaliningrad, working online'],
  ['header.cta', 'Discuss your website'],
  ['nav.work', 'Work'],
  ['nav.process', 'How we work'],
  ['controls.theme', 'Light or dark background'],
  ['hero.kinetic.primaryCta', 'Get a website price'],
  ['hero.pop.primaryCta', 'Get a website price'],
  ['hero.swiss.primaryCta', 'Get a website price'],
  ['hero.editorial.primaryCta', 'Get a website price'],
  ['hero.kinetic.tapeCode', 'We hand the code over to you'],
  ['hero.kinetic.ticker.landing', 'One-page websites'],
  ['hero.kinetic.ticker.miniApps', 'Apps inside Telegram'],
  ['hero.kinetic.ticker.mvp', 'First product versions for startups'],
  ['hero.kinetic.ticker.support', 'Website support after launch'],
  ['hero.terminal.status.ok', 'done'],
  ['hero.editorial.refDeadline', '— We put it in the contract: deadline'],
  ['hero.editorial.refQuality', '— We put it in the contract: speed'],
  ['hero.editorial.refWarranty', '— We put it in the contract: one-year warranty'],
  ['work.heading', 'Work'],
  ['work.back', 'All work'],
  ['work.pageTitle', 'Work — MRSHKN'],
  [
    'work.note',
    "We show results in numbers you can check yourself, such as Google speed test scores. The studio's examples were made by us for demonstration; they are not client orders.",
  ],
  ['work.kind.demo', 'Studio example'],
  ['work.demoLink', 'Open the example website'],
  ['work.appLink', 'Open the app in Telegram'],
  ['work.stack', 'What the website is built with'],
  ['work.results', 'Results in numbers'],
  ['work.lighthouse', 'Screenshot: Google speed test (Lighthouse)'],
  ['work.design', 'Website style: {design}'],
  ['work.metaDescription', '{title}: what MRSHKN studio built, what with, and the results in numbers.'],
  [
    'work.pageDescription',
    "MRSHKN studio work: what we built, what with, and the results in numbers, such as Google speed test scores. The studio's examples were made for demonstration; they are not client orders.",
  ],
  ['process.sectionMark', 'How we work'],
  ['process.stepLabel', 'step {index}/04 · day {day}'],
  ['process.promises.price.value', 'Fixed'],
  [
    'process.promises.price.detail',
    'Pay in parts: 30%, 40% and 30%. Three rounds of revisions: three times you send your comments, each time as one list',
  ],
  ['process.promises.quality.value', 'Speed from 90 out of 100'],
  [
    'process.promises.quality.detail',
    "In Google's speed test on a phone, in each of three runs in a row. If it falls short because of our code or hosting setup, we fix it for free and send the acceptance certificate only after 90. If the site has a window from another service, such as online booking or a map, we tell you in advance what score we promise.",
  ],
  ['process.after.speed.title', 'Website speed'],
  [
    'process.after.speed.text',
    "On launch day we test the speed again with Google's test, this time on your address: it needs 90 out of 100 or more in each of three runs in a row. We attach the result to the acceptance certificate, the document that confirms the work is accepted. Below 90 because of our code or the way we set up the hosting, the server the website runs on? We fix it for free and do not hand over the work until it reaches 90. If the cause is not on our side, such as a hosting outage or code you added yourself, we show it to you in an email with the test reports. If you do not object within 2 working days, we write the cause into the certificate and hand over the work. If you disagree, we repeat the test at an agreed time and record the screen; your own test at the same time, with a screen recording, counts too. If there is no access to the domain for more than 10 working days, we hand over the work on the temporary link, test the speed after the move and, if needed, fix it under the warranty. A third-party widget, a window from another service such as online booking or a map, slows pages down. If you asked for one, we tell you before the contract what score we promise with it; if you ask later, we tell you before we add it.",
  ],
  ['process.after.acceptance.title', 'How you accept the work'],
  ['process.after.upkeep.title', 'Updates and backup copies of the website'],
  [
    'brief.lead',
    'Five short steps, about two minutes. We reply within an hour if you write on a working day, 10:00–19:00 Moscow time (9:00–18:00 Kaliningrad time).',
  ],
  [
    'brief.steps.product.note',
    'Pick the option closest to what you need. We will pin down the details in our messages.',
  ],
  [
    'brief.steps.niche.note',
    'Your field decides which sections the website needs and which of our ready-made example websites we start from.',
  ],
  [
    'brief.steps.design.note',
    'Style is how the website looks: colours, fonts, the shape of buttons. Not a final choice: we will suggest options for your project in our messages.',
  ],
  ['brief.designs.any', 'Choose for me'],
  [
    'brief.steps.scope.note',
    'Pick what is closest: from the deadline and the budget we will see which plan suits you.',
  ],
  [
    'brief.steps.contacts.note',
    'We reply within an hour on working days, 10:00–19:00 Moscow time (9:00–18:00 Kaliningrad time): we clarify the details and tell you when to expect the estimate.',
  ],
  [
    'brief.consent',
    'I agree to the processing of my personal data under the <policy>personal data processing policy</policy>',
  ],
  [
    'brief.meta.description',
    'Five short steps: what you need, your field, the style, timing and budget. We reply within an hour on working days, 9:00–18:00 Kaliningrad time.',
  ],
  [
    'briefThanks.meta.description',
    'Your request is with MRSHKN. We reply within an hour on working days, 9:00–18:00 Kaliningrad time.',
  ],
  ['briefThanks.command', './send-request'],
  [
    'briefThanks.note',
    'If more than an hour of working time has passed and you have not heard back, write to hello@mrshkn.com and we will check whether your request arrived.',
  ],
  ['footer.heading', 'Discuss your website'],
  ['footer.headingQuestion', 'Shall we discuss your website?'],
  ['footer.privacy', 'Personal data processing policy'],
  [
    'cookieBanner.text',
    'Yandex Metrica and Google Analytics 4 count visits to the website and to do this store cookies, small files, in your browser. We turn them on only if you agree. Read more in our <policy>personal data processing policy</policy>.',
  ],
  [
    'review.groups.author.note',
    'Your full name is needed only for the consent at the end of the form; it will not appear on the website. Next to the review everyone will see your signature, your business (for example, “coffee shop”) and a link, if you give one. The review also appears on the page of the work we did for you, so people may recognise you from it.',
  ],
  ['review.groups.documents.title', 'Consent and permission to publish'],
  [
    'review.groups.documents.note',
    'The review is sent only when both boxes at the bottom are checked: the first is consent to show your signature, business, link and the text of the review on the website, the second is your permission as the author to publish the text itself. If you change your mind, write to hello@mrshkn.com from the email you gave in the form, and we will remove the review within 3 working days.',
  ],
  ['review.linkError', "Paste the whole link, as in the browser's address bar: it starts with https:// or http://"],
  ['review.documents.edition', 'Document version: {version}'],
  [
    'process.steps.staging.text',
    "We make your second-round revisions and run a trial speed test on the temporary link: Google's test gives a page a score from 0 to 100. We send you the reports, you make the second payment of 40% and send the third and final list of comments. The required 90 is measured on launch day, on your own address.",
  ],
  ['footer.invitation', 'Tell us about your project — during working hours we reply within an hour.'],
  [
    'hero.editorial.quote',
    "“A one-page website takes four days from the day you choose the style. Speed: 90 out of 100 or more in Google's free speed test (PageSpeed Insights) on a phone, in each of three runs in a row. If it falls short because of us, we keep working for free and do not hand it over until it reaches 90. A one-year warranty.”",
  ],
  [
    'services.landing.after.speed.text',
    "On launch day we test the speed again with Google's test, this time on your address: it needs 90 out of 100 or more in each of three runs in a row. We attach the result to the acceptance certificate, the document that confirms the work is accepted. Below 90 because of our code or the way we set up the hosting, the server the website runs on? We fix it for free and do not hand over the work until it reaches 90. If the cause is not on our side, such as a hosting outage or code you added yourself, we show it to you in an email with the test reports. If you do not object within 2 working days, we write the cause into the certificate and hand over the work. If you disagree, we repeat the test at an agreed time and record the screen; your own test at the same time, with a screen recording, counts too. If there is no access to the domain for more than 10 working days, we hand over the work on the temporary link, test the speed after the move and, if needed, fix it under the warranty. A third-party widget, a window from another service such as online booking or a map, slows pages down. If you asked for one, we tell you before the contract what score we promise with it; if you ask later, we tell you before we add it.",
  ],
  [
    'services.industry.after.speed.text',
    "On launch day we test the speed again with Google's test, this time on your address: it needs 90 out of 100 or more in each of three runs in a row. We attach the result to the acceptance certificate, the document that confirms the work is accepted. Below 90 because of our code or the way we set up the hosting, the server the website runs on? We fix it for free and do not hand over the work until it reaches 90. If the cause is not on our side, such as a hosting outage or code you added yourself, we show it to you in an email with the test reports. If you do not object within 2 working days, we write the cause into the certificate and hand over the work. If you disagree, we repeat the test at an agreed time and record the screen; your own test at the same time, with a screen recording, counts too. If there is no access to the domain for more than 10 working days, we hand over the work on the temporary link, test the speed after the move and, if needed, fix it under the warranty. A third-party widget, a window from another service such as online booking or a map, slows pages down. If you asked for one, we tell you before the contract what score we promise with it; if you ask later, we tell you before we add it.",
  ],
  [
    'services.business.after.speed.text',
    "On launch day we test the speed again with Google's test, this time on your address: it needs 90 out of 100 or more in each of three runs in a row. We attach the result to the acceptance certificate, the document that confirms the work is accepted. Below 90 because of our code or the way we set up the hosting, the server the website runs on? We fix it for free and do not hand over the work until it reaches 90. If the cause is not on our side, such as a hosting outage or code you added yourself, we show it to you in an email with the test reports. If you do not object within 2 working days, we write the cause into the certificate and hand over the work. If you disagree, we repeat the test at an agreed time and record the screen; your own test at the same time, with a screen recording, counts too. If there is no access to the domain for more than 10 working days, we hand over the work on the temporary link, test the speed after the move and, if needed, fix it under the warranty. A third-party widget, a window from another service such as online booking or a map, slows pages down. If you asked for one, we tell you before the contract what score we promise with it; if you ask later, we tell you before we add it.",
  ],
  [
    'services.store.after.speed.text',
    "Before handover we check how fast the store opens on a phone with Google's test on your address: it needs 90 out of 100 or more in each of three runs in a row. We attach the result to the acceptance certificate, the document that confirms the work is accepted. Below 90 because of our code or the way we set up the hosting, the server the website runs on? We fix it for free and do not hand over the work until it reaches 90. If the cause is not on our side, such as a hosting outage or code you added yourself, we show it to you in an email with the test reports. If you do not object within 2 working days, we write the cause into the certificate and hand over the work. If you disagree, we repeat the test at an agreed time and record the screen; your own test at the same time, with a screen recording, counts too. If there is no access to the domain for more than 10 working days, we hand over the work on the temporary link, test the speed after the move and, if needed, fix it under the warranty. A third-party widget, a window from another service such as a chat, slows pages down. If you asked for one, we tell you before the contract what score we promise with it; if you ask later, we tell you before we add it. Which pages we test, and how we count the payment and delivery map widgets, we state in the estimate before the contract.",
  ],
  [
    'services.mvp.after.speed.text',
    "Before handover we check how fast the service opens on a phone with Google's test on the pages listed in the contract: it needs 90 out of 100 or more in each of three runs in a row. We attach the result to the acceptance certificate, the document that confirms the work is accepted. Below 90 because of our code or the way we set up the hosting, the server the website runs on? We fix it for free and do not hand over the work until it reaches 90. If the cause is not on our side, such as a hosting outage or code you added yourself, we show it to you in an email with the test reports. If you do not object within 2 working days, we write the cause into the certificate and hand over the work. If you disagree, we repeat the test at an agreed time and record the screen; your own test at the same time, with a screen recording, counts too. If there is no access to the domain for more than 10 working days, we hand over the work on the temporary link, test the speed after the move and, if needed, fix it under the warranty. A third-party widget, a window from another service such as a chat or a map, slows pages down. If you asked for one, we tell you before the contract what score we promise with it; if you ask later, we tell you before we add it. We test the pages that open without signing in: the home page, sign-in and sign-up. Google's test cannot open accounts behind a password.",
  ],
  ['briefThanks.text', 'We reply within an hour on working days, 10:00–19:00 Moscow time, on the channel you left us.'],
  [
    'hero.terminal.lead',
    'Websites and Telegram apps for business. We hand the code and passwords over to you, the speed test is in the acceptance certificate.',
  ],
  ['hero.terminal.log.lighthouse', 'trial Google speed test, payment 40%, your revisions: 3 of 3'],
  [
    'hero.terminal.log.handover',
    'the site on your domain, a 90+ speed test for the certificate, all passwords and files are yours, final\u00a030%',
  ],
  [
    'hero.subtitle',
    "Price and deadline in the contract. Your site scores 90+ out of 100 in Google's free speed test; if it falls short because of us, we keep working for free before handover. A one-year warranty. A one-page site in 4 days, a site for a clinic or a cafe in 7.",
  ],
  [
    'services.threeD.terms.items.4',
    "Google's speed test on a phone: 90 out of 100 or more in each of three runs in a row. If it falls short because of us, we keep working for free and do not hand it over until it reaches 90. For a 3D landing page we test the page itself, on your address on launch day. For a 3D block, the page with the scene on our temporary link. We answer for the weight and speed of the block itself: an image shows first, the scene loads after. The speed of the rest of the page depends on your site's code. The result goes with the acceptance certificate",
  ],
  [
    'pricing.basics.lighthouse',
    "Google's speed test on a phone: 90 out of 100 or more in each of three runs in a row. If it falls short because of us, we keep working for free and do not hand it over until it reaches 90. On launch day we test again, this time on your address: that result goes into the acceptance certificate. Third-party widgets, such as booking, maps or chat, slow a site down. If you chose them, we tell you before the contract what score we promise",
  ],
  [
    'services.landing.process.2.text',
    "We make your second-round revisions and run a trial speed test on the temporary link: Google's test gives a page a score from 0 to 100. We send you the reports, you make the second payment of 40% and send the third and final list of comments. The required 90 is measured on launch day, on your own address.",
  ],
  [
    'services.threeD.after.speed.text',
    "On launch day we test the speed with Google's test on a phone. The test gives a page from 0 to 100 points. We run it three times in a row, and each time it needs 90 or more. For a 3D landing page we test its page on your address. For a 3D block, the page with the scene on our temporary link: we are responsible for the speed of the block itself, while the speed of the rest of the page depends on how your site is built. With a 3D block your page gets slower: before the contract we measure it and tell you how many points it will lose. Below 90 because of our work? We fix it for free and do not hand over the work until it reaches 90. If the cause is not on our side, such as a hosting outage or code you added yourself, we show it to you in an email with the test reports. If you do not object within 2 working days, we write the cause into the certificate and hand over the work. If you disagree, we repeat the test at an agreed time and record the screen; your own test at the same time, with a screen recording, counts too. We attach the result to the acceptance certificate.",
  ],
];

/** Жаргон, которого нет в клиентских текстах ru.json: начало слова, нижний регистр; список утвердил Николай. */
const JARGON = [
  'критерий приемки',
  'лидформ',
  'сегментац',
  'постер-кадр',
  'поддомен',
  'адаптив',
  'стек',
  'скрин',
  'online',
  'mini app',
  'веб-разработ',
  'обработки пд',
];

/** Юридические разделы ведут свои блоки — жаргон в них не проверяем. */
const LEGAL_SECTIONS = ['docs', 'privacy'];

/** Пробелы любого вида (обычный, U+00A0, U+202F) — в обычный, затем нижний регистр. */
const folded = (text: string) => text.replace(/\s/g, ' ').toLowerCase();

const escaped = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Слово с начала слова: «стек» не ловит «истек», но ловит «стека». */
const wordStart = (word: string) => new RegExp(`(?<![\\p{L}\\p{N}_])${escaped(word)}`, 'u');

/** Все строковые значения JSON рекурсивно, с путем через точку (индекс массива — число). */
const entriesOf = (value: unknown, path = ''): Entry[] => {
  if (typeof value === 'string') {
    return [{ path, text: value }];
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => entriesOf(child, path === '' ? key : `${path}.${key}`));
  }

  return [];
};

const valueAt = (root: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => {
    if (node !== null && typeof node === 'object') {
      return (node as Record<string, unknown>)[key];
    }

    return undefined;
  }, root);

describe('тексты главной, квиза и служебные в ru.json — дословно утвержденные', () => {
  it.each(APPROVED_RU)('%s', (path, expected) => {
    expect(valueAt(ru, path)).toBe(expected);
  });
});

describe('тексты главной, квиза и служебные в en.json — перевод утвержденных', () => {
  it.each(APPROVED_EN)('%s', (path, expected) => {
    expect(valueAt(en, path)).toBe(expected);
  });
});

describe('в ru.json вне юридических разделов нет жаргона', () => {
  const entries = Object.entries(ru)
    .filter(([section]) => !LEGAL_SECTIONS.includes(section))
    .flatMap(([section, value]) => entriesOf(value, section));

  it.each(JARGON)('%s', (word) => {
    const pattern = wordStart(word);
    const found = entries.filter(({ text }) => pattern.test(folded(text))).map(({ path }) => `${path}: ${word}`);

    expect(found, `«${word}» в ключах ru.json: ${found.join(', ')}`).toEqual([]);
  });
});
