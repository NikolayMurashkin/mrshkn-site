import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

type Locale = 'ru' | 'en';

type Entry = { path: string; text: string };

const MESSAGES: Record<Locale, unknown> = { ru, en };

const LOCALES: Locale[] = ['ru', 'en'];

/** Пробелы любого вида (обычный, U+00A0, U+202F) — в обычный: тексты сайта держат неразрывные пробелы. */
const normalize = (text: string) => text.replace(/\s/g, ' ');

/**
 * Тексты цены кейса, опоздания, опции geo, группы базы, 3D и приложения в Telegram — дословно утвержденные.
 * Неразрывный пробел — escape `\u00a0`, обычный пробел — обычный.
 */
const APPROVED_RU: [string, string][] = [
  [
    'pricing.caseOffer',
    'Мы новая студия, и\u00a0нам нужны примеры работ. Поэтому первые пять проектов делаем по\u00a0«цене кейса» (кейс\u00a0— пример нашей работы): разработка на\u00a030\u00a0% дешевле. Скидка\u00a0— от\u00a0обычной цены разработки. Опции, MAX и\u00a0поддержка\u00a0— по\u00a0обычной цене. Скидку даем сразу: в\u00a0договоре стоит цена со\u00a0скидкой, все три части оплаты считаем от\u00a0нее. Сколько мест осталось, скажем в\u00a0ответ на\u00a0заявку. Взамен просим две вещи. Первое: вы разрешаете показывать ваш сайт или приложение как пример нашей работы, без данных ваших клиентов. Второе: вы пишете отзыв о\u00a0том, как шла работа,\u00a0— любой, в\u00a0том числе критический. Критические отзывы публикуем так же, как хорошие.',
  ],
  [
    'pricing.basics.deadline',
    'Срок записываем в\u00a0договор. Опоздали по\u00a0нашей вине\u00a0— за\u00a0каждый день просрочки снижаем цену на\u00a02\u00a0%, всего не\u00a0больше чем на\u00a020\u00a0%. Эту сумму вычитаем из\u00a0последнего платежа. Считаем от\u00a0цены, которую вы платите по\u00a0договору, вместе с\u00a0опциями',
  ],
  [
    'services.industry.faq.2.answer',
    'За\u00a0{term}. Считаем календарные дни, выходные тоже входят. Срок начинаем считать со\u00a0дня, когда вы выбрали стиль сайта, и\u00a0записываем в\u00a0договор. Три стиля показываем через 2\u00a0рабочих дня после предоплаты и\u00a0материалов. Если тексты пишем мы, срок длиннее на\u00a02\u00a0дня. Дни, пока мы ждем ваших замечаний, в\u00a0срок не\u00a0входят: дата сдачи сдвигается на\u00a0столько же дней. Торопиться с\u00a0ответом не\u00a0нужно. Если пауза затянется надолго, что делаем дальше, записано в\u00a0договоре. Если мы не\u00a0успели по\u00a0своей вине, за\u00a0каждый день просрочки снижаем цену на\u00a02\u00a0%, всего не\u00a0больше чем на\u00a020\u00a0%. Эту сумму вычитаем из\u00a0последнего платежа.',
  ],
  [
    'services.landing.faq.1.answer',
    'За\u00a0{term}. Считаем календарные дни, выходные тоже входят. Срок начинаем считать со\u00a0дня, когда вы выбрали стиль сайта, и\u00a0записываем в\u00a0договор. Три стиля показываем через 2\u00a0рабочих дня после предоплаты и\u00a0материалов. Если тексты пишем мы, срок длиннее на\u00a02\u00a0дня. Дни, пока мы ждем ваших замечаний, в\u00a0срок не\u00a0входят: дата сдачи сдвигается на\u00a0столько же дней. Торопиться с\u00a0ответом не\u00a0нужно. Если пауза затянется надолго, что делаем дальше, записано в\u00a0договоре. Если мы не\u00a0успели по\u00a0своей вине, за\u00a0каждый день просрочки снижаем цену на\u00a02\u00a0%, всего не\u00a0больше чем на\u00a020\u00a0%. Эту сумму вычитаем из\u00a0последнего платежа.',
  ],
  [
    'services.business.faq.3.answer',
    '{term}. Срок начинаем считать со\u00a0дня, когда вы выбрали стиль сайта, и\u00a0записываем в\u00a0договор. Три стиля показываем через 2\u00a0рабочих дня после предоплаты и\u00a0материалов. Если тексты пишем мы, срок длиннее на\u00a04\u00a0дня. Дни, пока мы ждем ваших замечаний, в\u00a0срок не\u00a0входят. Если мы не\u00a0успели по\u00a0своей вине, за\u00a0каждый день просрочки снижаем цену на\u00a02\u00a0%, всего не\u00a0больше чем на\u00a020\u00a0%, и\u00a0вычитаем это из\u00a0последнего платежа. В\u00a0цену входят три раунда правок: три раза вы присылаете список замечаний, и\u00a0мы вносим его целиком.',
  ],
  [
    'services.miniApp.basics.items.9',
    'Срок записываем в\u00a0договор. Опоздали по\u00a0нашей вине\u00a0— за\u00a0каждый день просрочки снижаем цену на\u00a02\u00a0%, всего не\u00a0больше чем на\u00a020\u00a0%. Эту сумму вычитаем из\u00a0последнего платежа. Считаем от\u00a0цены, которую вы платите по\u00a0договору, вместе с\u00a0опциями',
  ],
  [
    'services.threeD.terms.items.0',
    'Срок записываем в\u00a0договор: 4\u00a0недели на\u00a03D-блок, 6\u00a0недель на\u00a03D-лендинг. Первый день срока\u00a0— день, когда у\u00a0нас есть подробное описание и\u00a0материалы, а\u00a0для 3D-лендинга еще и\u00a0выбранный стиль. Пока мы ждем вашего ответа или согласования, срок стоит: дата сдачи сдвигается на\u00a0столько же дней. Если модель делаем с\u00a0нуля, на\u00a0это нужно дополнительное время\u00a0— его называем до\u00a0предоплаты, вместе с\u00a0ценой. Опоздали по\u00a0нашей вине\u00a0— за\u00a0каждый день просрочки снижаем цену на\u00a02\u00a0%, всего не\u00a0больше чем на\u00a020\u00a0%. Эту сумму вычитаем из\u00a0последнего платежа. Считаем от\u00a0цены, которую вы платите по\u00a0договору, вместе с\u00a0опциями',
  ],
  [
    'pricing.options.geo.note',
    'вопросы и\u00a0ответы на\u00a0сайте в\u00a0виде, понятном поисковикам и\u00a0нейросетям',
  ],
  ['pricing.basicsGroups.confidence', 'Уверенность в\u00a0результате'],
  [
    'services.threeD.basics.items.1',
    'Вашу 3D-модель из\u00a0программы для чертежей (CAD) облегчаем, чтобы она быстро открывалась на\u00a0сайте,\u00a0— это входит в\u00a0цену. Если модель сложнее обычной и\u00a0облегчать ее дольше, это отдельная строка в\u00a0смете: посчитаем по\u00a0вашему файлу до\u00a0предоплаты',
  ],
  ['services.threeD.faq.6.question', 'Какая модель сложнее обычной?'],
  [
    'services.threeD.faq.6.answer',
    'В\u00a0цену входит облегчение модели: убираем внутренние детали, которых снаружи не\u00a0видно, и\u00a0упрощаем поверхности, чтобы сцена быстро открывалась на\u00a0телефоне. Обычная модель\u00a0— это одно изделие до\u00a0300\u00a0деталей, например насос, станок или узел машины, в\u00a0файле из\u00a0программы для чертежей. Сложнее\u00a0— целая производственная линия или здание, модель из\u00a03D-сканера или файл с\u00a0ошибками поверхностей, которые приходится чинить вручную. Пришлите файл: бесплатно посмотрим его и\u00a0до\u00a0предоплаты скажем, входит ли облегчение в\u00a0цену. Если нет, это будет отдельная строка сметы с\u00a0точной суммой.',
  ],
  [
    'services.threeD.tierPoints.landing3d.4',
    'Админка: тексты, фото и\u00a0цены меняете сами, 3D-сцена через нее не\u00a0меняется',
  ],
  [
    'services.miniApp.faq.1.answer',
    'Записывать клиентов на\u00a0услуги, начислять бонусы постоянным клиентам, показывать ваши товары и\u00a0услуги списком, принимать заказы и\u00a0оплату, вести программу «приведи друга». Все это входит в\u00a0цену приложения под заказ. Что входит в\u00a0отраслевое приложение,\u00a0— в\u00a0его карточке. QR-меню, которое гость открывает с\u00a0телефона, и\u00a0каталог с\u00a0фильтрами\u00a0— за\u00a0доплату: это опция «QR-меню или каталог» в\u00a0списке «Опции» на\u00a0этой странице. Что нужно именно вам, обсуждаем, когда разбираем вашу задачу, до\u00a0договора.',
  ],
  [
    'services.miniApp.faq.2.answer',
    'Все функции из\u00a0ответа выше входят в\u00a0цену приложения под заказ. Цена выше, если нужны связи с\u00a0другими сервисами, например с\u00a0вашей CRM или сервисом записи, или функции сверх этого списка. Точную сумму называем, когда обсудим вашу задачу.',
  ],
  [
    'services.miniApp.basics.items.5',
    'Сервер\u00a0— компьютер в\u00a0интернете, на\u00a0котором работает приложение. Мы его настраиваем и\u00a0передаем вам. Платите за\u00a0него напрямую компании-провайдеру, не\u00a0нам: сейчас от\u00a02\u00a0000\u00a0₽ в\u00a0месяц, но\u00a0цены провайдеров меняются. Еще приложению нужен свой адрес в\u00a0интернете. Есть у\u00a0вас сайт\u00a0— бесплатно ставим приложение на\u00a0адрес внутри него, например app.вашсайт.ru. Сайта нет\u00a0— домен (адрес) покупаете сами у\u00a0регистратора, как для сайта, и\u00a0платите ему раз в\u00a0год, обычно несколько сотен рублей. Если приложение принимает оплату, платежный сервис берет комиссию с\u00a0каждого платежа, договор с\u00a0ним тоже на\u00a0вас. До\u00a0договора посчитаем, сколько за\u00a0год выйдут сервер и\u00a0домен, и\u00a0скажем, какой процент берет платежный сервис',
  ],
  [
    'process.steps.brief.text',
    'До\u00a0подписания договора пришлем список того, что нужно для сайта, например, тексты, фото и\u00a0логотип. Нет своих текстов\u00a0— напишем сами по\u00a0анкете и\u00a0разговору с\u00a0вами, это входит в\u00a0цену, но\u00a0срок вырастет на\u00a02\u00a0дня. Стили все равно покажем через 2\u00a0рабочих дня после предоплаты, с\u00a0заголовками по\u00a0анкете, а\u00a0тексты напишем после выбора стиля. К\u00a0дате из\u00a0договора нужны предоплата 30\u00a0% и\u00a0материалы по\u00a0списку. Внесли предоплату, но\u00a0не\u00a0успели собрать материалы\u00a0— переносим начало работы на\u00a0ближайшую свободную дату. Предоплата при этом не\u00a0сгорает. После предоплаты рисуем картинки верха вашей главной страницы в\u00a0трех стилях: цвета, шрифты, вид кнопок и\u00a0блоков. Вы выбираете один. Три стиля показываем через 2\u00a0рабочих дня после предоплаты и\u00a0материалов, еще три\u00a0— через 2\u00a0рабочих дня после вашего ответа. Эти сроки тоже записываем в\u00a0договор, за\u00a0каждый рабочий день опоздания со\u00a0стилями тоже снижаем цену на\u00a02\u00a0%, в\u00a0общих пределах 20\u00a0%. Можно взять и\u00a0готовый: один из\u00a0пяти стилей этого сайта или стиль нашего демо. Не\u00a0подошел ни\u00a0один из\u00a0трех\u00a0— нарисуем еще три. Не\u00a0подошли и\u00a0они\u00a0— вернем всю предоплату. С\u00a0выбора стиля начинается срок, это день 1. В\u00a0этот день собираем верх главной страницы в\u00a0выбранном стиле\u00a0— то, что человек видит сразу. Это уже рабочая страница: ее можно открыть на\u00a0телефоне. Вы присылаете замечания одним списком\u00a0— это первый из\u00a0трех раундов правок. Замечания к\u00a0остальной странице присылаете во\u00a0втором и\u00a0третьем раунде.',
  ],
  [
    'services.landing.process.0.text',
    'До\u00a0подписания договора пришлем список того, что нужно для сайта, например, тексты, фото и\u00a0логотип. Нет своих текстов\u00a0— напишем сами по\u00a0анкете и\u00a0разговору с\u00a0вами, это входит в\u00a0цену, но\u00a0срок вырастет на\u00a02\u00a0дня. Стили все равно покажем через 2\u00a0рабочих дня после предоплаты, с\u00a0заголовками по\u00a0анкете, а\u00a0тексты напишем после выбора стиля. К\u00a0дате из\u00a0договора нужны предоплата 30\u00a0% и\u00a0материалы по\u00a0списку. Внесли предоплату, но\u00a0не\u00a0успели собрать материалы\u00a0— переносим начало работы на\u00a0ближайшую свободную дату. Предоплата при этом не\u00a0сгорает. После предоплаты рисуем картинки верха вашей главной страницы в\u00a0трех стилях: цвета, шрифты, вид кнопок и\u00a0блоков. Вы выбираете один. Три стиля показываем через 2\u00a0рабочих дня после предоплаты и\u00a0материалов, еще три\u00a0— через 2\u00a0рабочих дня после вашего ответа. Эти сроки тоже записываем в\u00a0договор, за\u00a0каждый рабочий день опоздания со\u00a0стилями тоже снижаем цену на\u00a02\u00a0%, в\u00a0общих пределах 20\u00a0%. Можно взять и\u00a0готовый: один из\u00a0пяти стилей этого сайта или стиль нашего демо. Не\u00a0подошел ни\u00a0один из\u00a0трех\u00a0— нарисуем еще три. Не\u00a0подошли и\u00a0они\u00a0— вернем всю предоплату. С\u00a0выбора стиля начинается срок, это день 1. В\u00a0этот день собираем верх главной страницы в\u00a0выбранном стиле\u00a0— то, что человек видит сразу. Это уже рабочая страница: ее можно открыть на\u00a0телефоне. Вы присылаете замечания одним списком\u00a0— это первый из\u00a0трех раундов правок. Замечания к\u00a0остальной странице присылаете во\u00a0втором и\u00a0третьем раунде.',
  ],
];

/** Те же ключи на английском — дословно утвержденный перевод. */
const APPROVED_EN: [string, string][] = [
  [
    'pricing.caseOffer',
    "We are a new studio and we need examples of our work. So we do our first five projects at the “case-study price” (a case study is an example of our work): development is 30% off. The discount is taken from the regular development price. Options, MAX and support are at the regular price. We give the discount right away: the contract states the discounted price, and all three payments are calculated from it. We will tell you how many spots are left when we reply to your request. In return we ask for two things. First, you let us show your site or app as an example of our work, without your customers' data. Second, you write a review of how the work went, any review, including a critical one. We publish critical reviews the same way as positive ones.",
  ],
  [
    'pricing.basics.deadline',
    'The deadline goes into the contract. If we are late through our fault, we cut the price by 2% for each day of delay, 20% at most. That amount comes off the final payment. It is calculated from the price you pay under the contract, options included',
  ],
  [
    'services.industry.faq.2.answer',
    "In {term}. We count calendar days, weekends included. The deadline starts the day you pick the style of the site, and it is set in the contract. We show three styles 2 working days after the prepayment and the materials. If we write the texts, the deadline is 2 days longer. Days we spend waiting for your comments don't count: the delivery date moves by the same number of days. There is no need to rush your reply. If a pause drags on for a long time, the contract says what happens next. If we are late through our own fault, we cut the price by 2% for each day of delay, 20% at most. That amount comes off the final payment.",
  ],
  [
    'services.landing.faq.1.answer',
    "In {term}. We count calendar days, weekends included. The deadline starts the day you pick the style of the site, and it is set in the contract. We show three styles 2 working days after the prepayment and the materials. If we write the texts, the deadline is 2 days longer. Days we spend waiting for your comments don't count: the delivery date moves by the same number of days. There is no need to rush your reply. If a pause drags on for a long time, the contract says what happens next. If we are late through our own fault, we cut the price by 2% for each day of delay, 20% at most. That amount comes off the final payment.",
  ],
  [
    'services.business.faq.3.answer',
    "{term}. The deadline starts the day you pick the style of the site, and it is set in the contract. We show three styles 2 working days after the prepayment and the materials. If we write the texts, the deadline is 4 days longer. Days we spend waiting for your comments don't count. If we are late through our own fault, we cut the price by 2% for each day of delay, 20% at most, and take it off the final payment. Three rounds of revisions are included: three times you send a list of comments, and we make all of it.",
  ],
  [
    'services.miniApp.basics.items.9',
    'The deadline goes into the contract. If we are late through our fault, we cut the price by 2% for each day of delay, 20% at most. That amount comes off the final payment. It is calculated from the price you pay under the contract, options included',
  ],
  [
    'services.threeD.terms.items.0',
    'The deadline goes into the contract: 4 weeks for a 3D block, 6 weeks for a 3D landing page. Day one is the day we have the detailed description and the materials, and for a 3D landing page also the chosen style. While we wait for your reply or sign-off, the clock stops: the delivery date moves by the same number of days. If we build the model from scratch, that takes extra time; we name it before the prepayment, together with the price. If we are late through our fault, we cut the price by 2% for each day of delay, 20% at most. That amount comes off the final payment. It is calculated from the price you pay under the contract, options included',
  ],
  ['pricing.options.geo.note', 'questions and answers on the site in a form search engines and AI can understand'],
  ['pricing.basicsGroups.confidence', 'Peace of mind'],
  [
    'services.threeD.basics.items.1',
    'We simplify your 3D model from the drawing software (CAD) so that it opens quickly on the site; this is included in the price. If the model is more complex than usual and takes longer to simplify, that is a separate line in the estimate: we work it out from your file before the prepayment',
  ],
  ['services.threeD.faq.6.question', 'Which model counts as more complex than usual?'],
  [
    'services.threeD.faq.6.answer',
    'Simplifying the model is included in the price: we remove inner parts that cannot be seen from outside and simplify the surfaces so that the scene opens quickly on a phone. A usual model is one product with up to 300 parts, such as a pump, a machine tool or a vehicle assembly, in a file from drawing software. More complex means a whole production line or a building, a model from a 3D scanner, or a file with broken surfaces that have to be fixed by hand. Send us the file: we will look at it for free and tell you before the prepayment whether simplifying it is included in the price. If it is not, it will be a separate line in the estimate with the exact amount.',
  ],
  [
    'services.threeD.tierPoints.landing3d.4',
    'An admin panel: you change texts, photos and prices yourself; the 3D scene is not changed through it',
  ],
  [
    'services.miniApp.faq.1.answer',
    'Booking customers for services, giving bonuses to regular customers, showing your products and services as a list, taking orders and payments, running a “bring a friend” program. All of this is included in the price of a custom app. What the industry app includes is on its card. A QR menu guests open on their phones and a catalog with filters cost extra: that is the “QR menu or catalog” option in the “Options” list on this page. What exactly you need we discuss when we go through your task, before the contract.',
  ],
  [
    'services.miniApp.faq.2.answer',
    'All the features from the answer above are included in the price of a custom app. The price is higher if you need connections to other services, such as your CRM or booking service, or features beyond this list. We name the exact amount once we discuss your task.',
  ],
  [
    'services.miniApp.basics.items.5',
    'A server is a computer on the internet that the app runs on. We set it up and hand it over to you. You pay for it directly to the provider company, not to us: currently from 2,000 ₽ a month, but provider prices change. The app also needs its own web address. If you have a site, we put the app on an address within it for free, such as app.yoursite.com. If you do not, you buy a domain (an address) yourself from a registrar, the same as for a site, and pay for it once a year, usually a few hundred rubles. If the app takes payments, the payment service charges a fee on each payment, and the contract with it is in your name too. Before the contract we work out what the server and domain come to per year and tell you what percentage the payment service takes',
  ],
];

/**
 * Старые условия цены кейса и опоздания: скидка к акту при отзыве, скидка из последнего платежа, возврат разницы.
 * Сравнение без учета регистра, пробелы любого вида — обычные.
 */
const REMOVED_PHRASES: Record<Locale, string[]> = {
  ru: ['Нет отзыва к акту', 'Что при этом со скидкой', 'скидку вычитаем из последнего платежа', 'разницу возвращаем'],
  en: [
    'No review by the acceptance certificate',
    'what happens to the discount',
    'the discount comes off the final payment',
    'refund the difference',
  ],
};

/** Ежемесячная плата опций в коде: поле опции, подпись цены и классы стилей. Слово `month` не задевается. */
const MONTHLY_CODE = [/\bmonthly\b/, /monthlyAddon/, /optionMonthly/];

/** Первые шесть вопросов FAQ страницы 3D — прежние, новый вопрос встает седьмым. */
const THREE_D_FAQ_QUESTIONS: Record<Locale, string[]> = {
  ru: [
    'У\u00a0нас нет 3D-модели\u00a0— что делать?',
    'Как 3D работает на\u00a0старых телефонах?',
    'Сколько стоят правки после трех списков замечаний?',
    'Можно ли поставить 3D на\u00a0Тильду, WordPress или 1С-Битрикс?',
    'Чем 3D-блок отличается от\u00a03D-лендинга?',
    'Можно ли скачать нашу модель с\u00a0сайта?',
  ],
  en: [
    "We don't have a 3D model — what now?",
    'How does 3D work on older phones?',
    'How much do revisions cost after three lists of comments?',
    'Can you put 3D on Tilda, WordPress or 1C-Bitrix?',
    'What is the difference between a 3D block and a 3D landing page?',
    'Can someone download our model from the site?',
  ],
};

/** Пункт админки — последний у 3D-лендинга. */
const ADMIN_POINT: Record<Locale, string> = { ru: 'Админк', en: 'admin panel' };

/** Все строковые значения JSON рекурсивно, с путем. */
const entriesOf = (value: unknown, path = ''): Entry[] => {
  if (typeof value === 'string') {
    return [{ path, text: value }];
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => entriesOf(child, path === '' ? key : `${path}.${key}`));
  }

  return [];
};

const valueAt = (locale: Locale, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => {
    if (node !== null && typeof node === 'object') {
      return (node as Record<string, unknown>)[key];
    }

    return undefined;
  }, MESSAGES[locale]);

const recordAt = (locale: Locale, path: string): Record<string, unknown> => {
  const value = valueAt(locale, path);

  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
};

const listAt = (locale: Locale, path: string): unknown[] => {
  const value = valueAt(locale, path);

  return Array.isArray(value) ? value : [];
};

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }

    return /\.(tsx?|scss)$/.test(name) ? [path] : [];
  });

describe('подписи ежемесячной платы нет в переводах', () => {
  it.each(LOCALES)('%s: pricing.price без monthlyAddon', (locale) => {
    expect(Object.hasOwn(recordAt(locale, 'pricing.price'), 'monthlyAddon')).toBe(false);
  });

  it('ru: имена и пояснения опций без «/ мес»', () => {
    const found = entriesOf(recordAt('ru', 'pricing.options'))
      .filter(({ path, text }) => /\.(name|note)$/.test(path) && normalize(text).includes('/ мес'))
      .map(({ path, text }) => `pricing.options.${path}: ${text}`);

    expect(found).toEqual([]);
  });
});

describe('старых условий цены кейса и опоздания нет в переводах', () => {
  it.each(REMOVED_PHRASES.ru)('ru: нет «%s»', (phrase) => {
    const found = entriesOf(ru)
      .filter(({ text }) => normalize(text).toLowerCase().includes(phrase.toLowerCase()))
      .map(({ path }) => path);

    expect(found).toEqual([]);
  });

  it.each(REMOVED_PHRASES.en)('en: нет «%s»', (phrase) => {
    const found = entriesOf(en)
      .filter(({ text }) => normalize(text).toLowerCase().includes(phrase.toLowerCase()))
      .map(({ path }) => path);

    expect(found).toEqual([]);
  });
});

describe('ежемесячной платы нет в коде', () => {
  it('в src нет monthly, monthlyAddon и optionMonthly', () => {
    const found = sourceFiles('src').flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, index) => (MONTHLY_CODE.some((pattern) => pattern.test(line)) ? [`${file}:${index + 1}`] : [])),
    );

    expect(found).toEqual([]);
  });
});

describe('тексты цены кейса, опоздания, 3D и приложения в ru.json — дословно утвержденные', () => {
  it.each(APPROVED_RU)('%s', (path, expected) => {
    expect(valueAt('ru', path)).toBe(expected);
  });
});

describe('тексты цены кейса, опоздания, 3D и приложения в en.json — дословно утвержденные', () => {
  it.each(APPROVED_EN)('%s', (path, expected) => {
    expect(valueAt('en', path)).toBe(expected);
  });
});

describe('3D-лендинг: пункт админки', () => {
  it.each(LOCALES)('%s: у landing3d пять пунктов, последний — админка', (locale) => {
    const points = listAt(locale, 'services.threeD.tierPoints.landing3d');

    expect(points).toHaveLength(5);
    expect(points.at(-1)).toEqual(expect.stringContaining(ADMIN_POINT[locale]));
  });
});

describe('FAQ страницы 3D: вопрос о сложной модели', () => {
  it.each(LOCALES)('%s: семь вопросов, первые шесть прежние', (locale) => {
    const questions = listAt(locale, 'services.threeD.faq').map((item) => (item as { question?: unknown }).question);

    expect(questions).toHaveLength(7);
    expect(questions.slice(0, 6)).toEqual(THREE_D_FAQ_QUESTIONS[locale]);
  });
});
