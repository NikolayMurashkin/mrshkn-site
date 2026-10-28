import { NextIntlClientProvider } from 'next-intl';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useServicePage } from '@/components/ServicePage/use-service-page';
import type { ServicePageData } from '@/components/ServicePage/types';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

type Locale = 'ru' | 'en';

type Entry = { path: string; text: string };

type Messages = typeof ru;

type ProviderProps = { locale: string; timeZone: string; messages: Messages; children?: ReactNode };

type ProbeProps = { serviceId: string; onData: (data: ServicePageData | null) => void };

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const MESSAGES: Record<Locale, Messages> = { ru, en: en as Messages };

/** Тексты услуг и цен, выбранные Николаем, — дословно. Неразрывный пробел — escape `\u00a0`, обычный — обычный. */
const APPROVED_RU: [string, string][] = [
  ['pricing.columns.product', 'Услуга'],
  ['pricing.plans.industry.name', 'Сайт для вашей сферы'],
  [
    'pricing.plans.store.summary',
    'Каталог до\u00a0100\u00a0товаров, корзина, оплата и\u00a0доставка. Заказы видите и\u00a0обрабатываете в\u00a0админке\u00a0— своем разделе сайта',
  ],
  [
    'pricing.basics.code',
    'Сайт пишем сами, программным кодом на\u00a0Next.js, а\u00a0не\u00a0собираем в\u00a0конструкторе вроде Тильды',
  ],
  [
    'pricing.basics.responsive',
    'Сайт удобно смотреть на\u00a0любом экране: от\u00a0маленького телефона (320\u00a0пикселей в\u00a0ширину) до\u00a0большого монитора (1920\u00a0пикселей)',
  ],
  [
    'pricing.basics.seo',
    'Готовим сайт к\u00a0поиску. Добавляем служебные описания для поисковиков (schema.org) и\u00a0для нейросетей (llms.txt). И\u00a0превью\u00a0— картинку с\u00a0заголовком, которая видна, когда ссылку на\u00a0сайт присылают в\u00a0мессенджере (OG). Места в\u00a0выдаче не\u00a0обещаем',
  ],
  [
    'pricing.basics.sources',
    'Передаем вам исходный код\u00a0— все файлы, из\u00a0которых собраны сайт, админка и\u00a0приложение. С\u00a0ними вы можете менять сайт и\u00a0перейти к\u00a0другому разработчику без нас',
  ],
  ['pricing.options.quiz.name', 'Тест для клиентов (квиз)'],
  ['pricing.options.quiz.note', '5\u00a0вопросов: заявка приходит к\u00a0вам уже с\u00a0ответами клиента'],
  ['pricing.options.calculator.note', 'клиент выбирает, что ему нужно, и\u00a0сразу видит цену'],
  [
    'pricing.options.reviews.note',
    'отзывы о\u00a0вас с\u00a0Яндекс Карт, 2ГИС и\u00a0Google сами появляются на\u00a0сайте',
  ],
  ['pricing.options.messengers.name', 'Кнопки мессенджеров на\u00a0сайте'],
  ['pricing.options.messengers.note', 'и\u00a0бот, который сразу отвечает клиенту, пока вы заняты'],
  ['pricing.options.language.note', 'перевод страниц и\u00a0кнопка смены языка'],
  ['pricing.options.blog.note', 'новости и\u00a0статьи публикуете сами, без нас'],
  ['pricing.options.crm.name', 'Заявки\u00a0— сразу в\u00a0вашу CRM'],
  [
    'pricing.options.crm.note',
    'Bitrix24 или amoCRM\u00a0— программы учета клиентов. Заявка попадает туда сама, с\u00a0пометкой, откуда пришел клиент',
  ],
  [
    'pricing.options.catalog.note',
    'гость открывает меню по\u00a0QR-коду с\u00a0телефона и\u00a0выбирает блюда или товары фильтрами',
  ],
  ['pricing.options.geo.name', 'Расширенный пакет для поиска через нейросети'],
  ['pricing.extrasHeading', 'Сверх тарифа'],
  [
    'pricing.extras.hour.summary',
    'Правки и\u00a0доработки, которые не\u00a0входят в\u00a0тариф: например, после трех раундов правок или когда закончились часы на\u00a0тарифе поддержки',
  ],
  ['servicePage.priceKind.from', 'Нижняя граница цены. Точную назовем, когда обсудим вашу задачу'],
  ['services.landing.faq.3.question', 'Найдут ли сайт через нейросети, например ChatGPT?'],
  [
    'services.business.faq.2.answer',
    'Каждую страницу сверх семи считаем отдельно: цена зависит от\u00a0того, сколько на\u00a0ней работы. Сумму назовем до\u00a0начала работ.',
  ],
  ['services.business.faq.3.question', 'За\u00a0сколько дней будет готов сайт «Бизнес»?'],
  ['servicePage.nichesHeading', 'Выберите сферу'],
  ['servicePage.nicheDemo', 'Открыть пример сайта'],
  [
    'services.industry.niches.horeca.text',
    'Меню на\u00a0сайте, в\u00a0котором гость выбирает блюда фильтрами, меню по\u00a0QR-коду, карта проезда и\u00a0часы работы',
  ],
  ['services.industry.faq.0.question', 'Чем сайт для вашей сферы отличается от\u00a0«Старта»?'],
  ['services.industry.faq.2.question', 'За\u00a0сколько дней будет готов сайт для вашей сферы?'],
  ['servicePage.tryIt.apps.coffee.module', 'Бонусы'],
  [
    'services.miniApp.faq.3.answer',
    'Бот в\u00a0Telegram, через который клиенты открывают приложение, и\u00a0админка\u00a0— раздел, где вы сами меняете тексты, фото и\u00a0цены и\u00a0смотрите записи, заказы и\u00a0бонусы. Остальное, что входит в\u00a0цену,\u00a0— в\u00a0списке «Что входит» на\u00a0этой странице. Точный срок\u00a0— от\u00a03 до\u00a04\u00a0недель со\u00a0дня, когда вы выбрали стиль,\u00a0— называем, когда обсудим вашу задачу, и\u00a0записываем в\u00a0договор.',
  ],
  ['services.miniApp.process.0.title', 'Задача, функции и\u00a0выбор стиля'],
  ['services.miniApp.process.1.title', 'Шаги клиента и\u00a0рисунки экранов'],
  [
    'services.miniApp.basics.items.0',
    'Приложение пишем сами, программным кодом, а\u00a0не\u00a0собираем в\u00a0конструкторе. Исходный код\u00a0— все файлы, из\u00a0которых собраны приложение, бот и\u00a0админка,\u00a0— передаем вам: менять его и\u00a0передать другому разработчику можете без нас',
  ],
  [
    'services.miniApp.basics.items.6',
    'Три раунда правок в\u00a0цене. Раунд\u00a0— это все ваши замечания одним списком, мы вносим его целиком. Правки\u00a0— это тексты, фото, цвет отдельных кнопок и\u00a0блоков, порядок экранов; новые экраны, функции и\u00a0смена стиля целиком\u00a0— отдельная работа',
  ],
  [
    'services.store.faq.0.answer',
    'В\u00a0тариф входит каталог до\u00a0100\u00a0товаров. Если товаров больше, доплату за\u00a0остальные посчитаем отдельно.',
  ],
  ['services.store.faq.1.question', 'Можно ли на\u00a0сайте оплатить заказ и\u00a0выбрать доставку?'],
  [
    'services.store.faq.1.answer',
    'Да. Покупатель кладет товары в\u00a0корзину, платит на\u00a0сайте и\u00a0выбирает доставку. Заказы вы видите в\u00a0админке заказов\u00a0— разделе, где их обрабатываете. Через какой сервис принимать оплату (например, ЮKassa) и\u00a0какой службой доставлять, решаем вместе, когда обсуждаем задачу.',
  ],
  [
    'services.store.faq.2.answer',
    'У\u00a0каждого магазина свой каталог, проще или сложнее, и\u00a0свой набор связей с\u00a0другими сервисами, например с\u00a0оплатой и\u00a0доставкой. Точную сумму называем, когда обсудим вашу задачу.',
  ],
  ['services.store.process.2.title', 'Собираем магазин'],
  [
    'services.mvp.faq.0.answer',
    'MVP\u00a0— первая рабочая версия вашего сервиса, в\u00a0ней только главное. Пользователи входят по\u00a0логину и\u00a0паролю, у\u00a0каждого свой личный кабинет. В\u00a0сервисе можно заплатить, он связан с\u00a0другими нужными вам сервисами и\u00a0считает статистику. С\u00a0такой версией можно проверить идею на\u00a0настоящих пользователях.',
  ],
  [
    'services.mvp.faq.1.answer',
    'Срок зависит от\u00a0того, сколько в\u00a0сервисе разных личных кабинетов (например, для клиентов и\u00a0для сотрудников) и\u00a0связей с\u00a0другими сервисами. Точный срок записываем в\u00a0договор, когда обсудим вашу задачу.',
  ],
  [
    'services.mvp.faq.2.answer',
    'Вам. Исходный код\u00a0— все файлы, из\u00a0которых собран сервис,\u00a0— передаем вам вместе с\u00a0паролями. С\u00a0ним вы можете менять сервис и\u00a0перейти к\u00a0другому разработчику без нас.',
  ],
  ['services.mvp.process.1.title', 'Дизайн и\u00a0устройство сервиса'],
  ['services.mvp.process.2.title', 'Делаем сервис по\u00a0частям'],
  [
    'servicePage.threeD.tiersNote',
    'Нажмите на\u00a0формат\u00a0— откроется расчет стоимости, где этот формат уже выбран',
  ],
  ['services.threeD.process.1.title', 'Форма модели и\u00a0углы обзора'],
  ['services.threeD.process.2.title', '3D-сцена и\u00a0подписи'],
  ['services.threeD.process.3.title', 'Заставка, телефоны, тест скорости'],
  [
    'services.threeD.faq.1.answer',
    'Сначала посетитель видит обычную картинку с\u00a0моделью, а\u00a03D загружается следом. Если телефон не\u00a0умеет показывать 3D (в\u00a0нем нет технологии WebGL\u00a02.0), вместо 3D он показывает картинку и\u00a0видеоролик, а\u00a0заявку можно оставить в\u00a0любом случае. На\u00a0слабом телефоне модель может вращаться медленнее, но\u00a0картинка, подписи и\u00a0заявка доступны сразу.',
  ],
  ['services.threeD.faq.2.question', 'Сколько стоят правки после трех списков замечаний?'],
  [
    'services.threeD.faq.3.answer',
    'Нет. Мы работаем только с\u00a0сайтами, написанными программным кодом, а\u00a0не\u00a0собранными на\u00a0Тильде, WordPress или 1С-Битриксе. 3D-блок встраиваем в\u00a0такой сайт: ваш, если его писали программисты без конструктора, или сделанный нами. Если ваш сайт на\u00a0конструкторе, можем сделать 3D-лендинг\u00a0— отдельную страницу со\u00a0своим адресом, например 3d.вашсайт.ru,\u00a0— и\u00a0поставить на\u00a0нее ссылку с\u00a0вашего сайта.',
  ],
  [
    'services.threeD.faq.4.answer',
    '3D-блок\u00a0— одна 3D-модель, которую мы встраиваем в\u00a0сайт, написанный кодом: ваш или сделанный нами. 3D-лендинг\u00a0— отдельный сайт на\u00a0одну страницу, в\u00a0центре которого модель. Тексты для него пишем мы по\u00a0вашим ответам на\u00a0наши вопросы. На\u00a0странице есть заявка и\u00a0все из\u00a0списка «Входит в\u00a0цену любого сайта», включая статистику посещений.',
  ],
  [
    'services.threeD.basics.note',
    'Входит в\u00a0оба формата. В\u00a03D-лендинг входит еще все из\u00a0списка «Входит в\u00a0цену любого сайта» в\u00a0разделе «Услуги и\u00a0цены»: заявки в\u00a0Telegram и\u00a0на\u00a0почту, статистика, удобный вид на\u00a0телефоне, настройка домена и\u00a0другое. Сервер оплачиваете вы напрямую провайдеру\u00a0— об\u00a0этом пункт ниже, домен\u00a0— раз в\u00a0год регистратору',
  ],
  [
    'services.threeD.basics.items.2',
    'В\u00a0цену входят до\u00a08\u00a0деталей или механизмов с\u00a0подписями; при нажатии модель приближает любую из\u00a0них. Больше деталей или механизмы в\u00a0движении\u00a0— дороже. Насколько, напишем в\u00a0смете, когда обсудим задачу, до\u00a0предоплаты. Цена в\u00a0договоре потом не\u00a0меняется, если вы сами не\u00a0попросите новую деталь или новый угол обзора\u00a0— тогда доплату называем до\u00a0начала работы',
  ],
  [
    'services.threeD.basics.items.3',
    'Пока 3D загружается, вверху страницы видна картинка с\u00a0моделью. Телефоны, которые не\u00a0умеют показывать 3D (нет WebGL\u00a02.0), вместо модели показывают картинку и\u00a0видеоролик',
  ],
  [
    'services.threeD.basics.items.4',
    'Файлы 3D-блока лежат на\u00a0том же сервере, где работает ваш сайт (на\u00a0вашем хостинге). 3D-лендингу нужен свой сервер: за\u00a0него вы платите напрямую компании-провайдеру, не\u00a0нам,\u00a0— сейчас от\u00a02\u00a0000\u00a0₽ в\u00a0месяц, но\u00a0цены провайдеров меняются',
  ],
  [
    'services.threeD.terms.items.0',
    'Срок записываем в\u00a0договор: 4\u00a0недели на\u00a03D-блок, 6\u00a0недель на\u00a03D-лендинг. Первый день срока\u00a0— день, когда у\u00a0нас есть подробное описание и\u00a0материалы, а\u00a0для 3D-лендинга еще и\u00a0выбранный стиль. Пока мы ждем вашего ответа или согласования, срок стоит: дата сдачи сдвигается на\u00a0столько же дней. Если модель делаем с\u00a0нуля, на\u00a0это нужно дополнительное время\u00a0— его называем до\u00a0предоплаты, вместе с\u00a0ценой. Опоздали по\u00a0нашей вине\u00a0— за\u00a0каждый день просрочки снижаем цену на\u00a02\u00a0%, всего не\u00a0больше чем на\u00a020\u00a0%. Эту сумму вычитаем из\u00a0последнего платежа. Считаем от\u00a0цены, которую вы платите по\u00a0договору, вместе с\u00a0опциями',
  ],
  [
    'services.threeD.terms.items.1',
    'Форму модели и\u00a0углы обзора утверждаем с\u00a0вами в\u00a0первую неделю, до\u00a0сборки 3D-сцены. Новая деталь или новый угол обзора после этого\u00a0— отдельная работа, цену называем до\u00a0начала',
  ],
  [
    'services.threeD.terms.items.3',
    'Стартуем один 3D-проект в\u00a0месяц. Дату старта называем, когда обсудим вашу задачу, до\u00a0предоплаты: если дата не\u00a0подходит, вы ничего не\u00a0платите',
  ],
  [
    'services.threeD.webgl',
    'Показывать 3D (технология WebGL\u00a02.0) умеют браузеры примерно у\u00a097\u00a0% пользователей интернета в\u00a0мире\u00a0— <link>по\u00a0данным Can I use</link>, сайта со\u00a0статистикой браузеров, на\u00a0октябрь\u00a02026. Остальным показываем картинку и\u00a0ролик вместо сцены',
  ],
  [
    'services.threeD.needs.items.0',
    '3D-модель изделия из\u00a0программы для чертежей (CAD) в\u00a0обычном формате: STEP, IGES и\u00a0другие. Или готовая модель для сайтов в\u00a0формате GLB',
  ],
  [
    'services.threeD.tierPoints.block3d.0',
    'Встраиваем в\u00a0сайт, написанный кодом, а\u00a0не\u00a0в\u00a0конструкторе: ваш или сделанный нами',
  ],
  [
    'services.threeD.tierPoints.block3d.1',
    'Подписи к\u00a0деталям\u00a0— по\u00a0вашему списку; при нажатии модель приближает деталь',
  ],
  ['services.threeD.tierPoints.block3d.2', 'Картинка, пока грузится 3D; телефон без 3D\u00a0— картинка и\u00a0ролик'],
  [
    'services.threeD.tierPoints.landing3d.0',
    'Тексты пишем мы по\u00a0вашим ответам на\u00a0наши вопросы; заявка\u00a0— в\u00a0Telegram и\u00a0на\u00a0почту',
  ],
  [
    'services.threeD.tierPoints.landing3d.1',
    'Все, что в\u00a0любом нашем сайте: удобный вид на\u00a0телефоне, подготовка к\u00a0поиску, статистика, окно про cookie, ваш адрес в\u00a0интернете (домен) и\u00a0защищенное соединение (SSL)',
  ],
  [
    'servicePage.support.tiersNote',
    'Нажмите на\u00a0тариф\u00a0— откроется расчет стоимости, где этот тариф уже выбран',
  ],
  ['services.support.process.1.title', 'Обновление программ сайта'],
  ['services.support.basics.items.2', 'Запасные копии сайта (бэкапы)'],
  [
    'services.miniApp.lead',
    'Приложение открывается прямо в\u00a0мессенджере\u00a0— Telegram или MAX, скачивать ничего не\u00a0нужно. В\u00a0нем клиенты записываются, смотрят меню, копят бонусы и\u00a0платят. В\u00a0комплекте бот, через который клиенты открывают приложение, и\u00a0админка\u00a0— раздел, где вы меняете тексты и\u00a0цены и\u00a0видите записи и\u00a0заказы',
  ],
  [
    'services.miniApp.basics.items.9',
    'Срок записываем в\u00a0договор. Опоздали по\u00a0нашей вине\u00a0— за\u00a0каждый день просрочки снижаем цену на\u00a02\u00a0%, всего не\u00a0больше чем на\u00a020\u00a0%. Эту сумму вычитаем из\u00a0последнего платежа. Считаем от\u00a0цены, которую вы платите по\u00a0договору, вместе с\u00a0опциями',
  ],
  [
    'services.business.faq.0.answer',
    'В\u00a0«Бизнесе» до\u00a0семи страниц, а\u00a0в\u00a0«Старте»\u00a0— одна. Есть блог\u00a0— раздел для новостей и\u00a0статей. Версию сайта на\u00a0втором языке можно добавить за\u00a0отдельную плату. Админка, где вы сами меняете тексты, фото и\u00a0цены, есть и\u00a0в\u00a0«Бизнесе», и\u00a0в\u00a0«Старте». От\u00a0сайта для вашей сферы «Бизнес» отличается тем, что страницы и\u00a0функции придумываем под вас с\u00a0нуля, а\u00a0не\u00a0берем из\u00a0демо. Поэтому он подходит любому делу, не\u00a0только клинике, кофейне или эксперту.',
  ],
  [
    'services.business.faq.5.answer',
    'Да. Страницы придумываем под вашу клинику: например, врачи, услуги и\u00a0цены. Приказ Минздрава №\u00a0118н перечисляет, что должно быть на\u00a0сайте клиники. Из\u00a0него без доплаты делаем три вещи: версию для слабовидящих, поиск по\u00a0сайту и\u00a0анкету, где пациенты оценивают качество услуг. В\u00a0«Бизнесе» до\u00a0семи страниц. Анкета и\u00a0поиск в\u00a0это число не\u00a0входят, а\u00a0страница со\u00a0сведениями о\u00a0клинике по\u00a0приказу\u00a0— одна из\u00a0семи. Остальное, что приказ требует показать на\u00a0сайте, например лицензию и\u00a0данные врачей, ставим по\u00a0вашим документам, а\u00a0дальше врачей и\u00a0цены вы меняете сами через админку. Что именно приказ требует от\u00a0вашей клиники, лучше уточнить у\u00a0юриста. Если юрист скажет, что нужен раздел, которого на\u00a0сайте нет, назовем цену до\u00a0начала работы. Онлайн-запись, где пациент сам выбирает врача и\u00a0время,\u00a0— за\u00a0доплату, цена\u00a0— в\u00a0списке «Опции» на\u00a0этой странице. Без нее пациент оставляет на\u00a0сайте заявку, и\u00a0она приходит вам в\u00a0Telegram и\u00a0на\u00a0почту. Для клиник есть и\u00a0тариф «Сайт для вашей сферы»: разделы берем из\u00a0нашего демо, а\u00a0дизайн рисуем под вас. Он выйдет дешевле и\u00a0быстрее «Бизнеса», если вам хватает этих разделов и\u00a0заявки на\u00a0прием: онлайн-записи с\u00a0выбором времени в\u00a0тарифе «Сайт для вашей сферы» нет.',
  ],
  [
    'services.industry.faq.0.answer',
    '«Старт»\u00a0— сайт из\u00a0одной страницы. Сайт для вашей сферы\u00a0— несколько страниц с\u00a0разделами и\u00a0функциями для вашей отрасли. Для каждой отрасли из\u00a0списка у\u00a0нас есть демо\u00a0— пример готового сайта. Из\u00a0него берем структуру: какие нужны разделы и\u00a0функции для вашей отрасли, например меню с\u00a0фильтрами для кофейни или врачей с\u00a0ценами для клиники. Дизайн рисуем под вас: три стиля на\u00a0выбор, как и\u00a0в\u00a0«Старте». Если вам нравится стиль самого демо, можно взять его. Сайт в\u00a0любом случае ваш: с\u00a0вашими текстами, фото и\u00a0на\u00a0вашем адресе. Сайт для вашей сферы дороже «Старта» и\u00a0делается дольше: в\u00a0нем несколько страниц и\u00a0функции для вашей отрасли, а\u00a0в\u00a0«Старте» одна страница. Страниц\u00a0— столько же, сколько в\u00a0демо вашей отрасли; новая страница\u00a0— отдельная работа. Для клиники ставим на\u00a0сайт предупреждение о\u00a0противопоказаниях и\u00a0данные лицензии, а\u00a0за\u00a0медицинские тексты отвечаете вы. Срок\u00a0— {term}.',
  ],
  [
    'services.landing.faq.3.answer',
    'В\u00a0базу входят schema.org, llms.txt, OG и\u00a0hreflang: сайт готов к\u00a0поиску через ИИ. Больше дает опция «Расширенный пакет для поиска через нейросети», ее состав и\u00a0цена\u00a0— в\u00a0общем прайсе. Места в\u00a0выдаче мы не\u00a0обещаем.',
  ],
];

/** Английские тексты тех же ключей — перевод утвержденного ru. */
const APPROVED_EN: [string, string][] = [
  ['pricing.columns.product', 'Service'],
  ['pricing.plans.industry.name', 'Site for your industry'],
  [
    'pricing.plans.store.summary',
    'A catalog of up to 100 products, a cart, payment and delivery. You see and process orders in the admin panel, your own section of the site',
  ],
  [
    'pricing.basics.code',
    'We write the site ourselves, in code on Next.js, rather than putting it together in a website builder like Tilda',
  ],
  [
    'pricing.basics.responsive',
    'The site is easy to view on any screen: from a small phone (320 pixels wide) to a large monitor (1920 pixels)',
  ],
  [
    'pricing.basics.seo',
    'We get the site ready for search. We add behind-the-scenes descriptions for search engines (schema.org) and for AI assistants (llms.txt). And a preview, a picture with a title that shows up when someone sends a link to the site in a messenger (OG). We do not promise a place in search results',
  ],
  [
    'pricing.basics.sources',
    'We hand over the source code: all the files your site, admin panel and app are built from. With them you can change the site and move to another developer without us',
  ],
  ['pricing.options.quiz.name', 'Customer quiz'],
  ['pricing.options.quiz.note', "5 questions: the request reaches you with the customer's answers already in it"],
  ['pricing.options.calculator.note', 'the customer picks what they need and sees the price right away'],
  ['pricing.options.reviews.note', 'reviews of you from Yandex Maps, 2GIS and Google appear on the site by themselves'],
  ['pricing.options.messengers.name', 'Messenger buttons on the site'],
  ['pricing.options.messengers.note', 'and a bot that answers the customer right away while you are busy'],
  ['pricing.options.language.note', 'page translation and a language switch'],
  ['pricing.options.blog.note', 'you publish news and articles yourself, without us'],
  ['pricing.options.crm.name', 'Leads go straight to your CRM'],
  [
    'pricing.options.crm.note',
    'Bitrix24 or amoCRM, programs for keeping track of customers. A lead lands there by itself, marked with where the customer came from',
  ],
  [
    'pricing.options.catalog.note',
    'a guest opens the menu from a QR code on their phone and picks dishes or products with filters',
  ],
  ['pricing.options.geo.name', 'Extended pack for AI search'],
  ['pricing.extrasHeading', 'Beyond the plan'],
  [
    'pricing.extras.hour.summary',
    'Revisions and extra work not included in the plan: for example, after three rounds of revisions or when the hours on your support plan have run out',
  ],
  ['servicePage.priceKind.from', 'The lowest price. We name the exact one once we discuss your task'],
  ['services.landing.faq.3.question', 'Will people find the site through AI, such as ChatGPT?'],
  [
    'services.business.faq.2.answer',
    'Each page beyond seven is priced separately: the price depends on how much work it takes. We name the amount before work starts.',
  ],
  ['services.business.faq.3.question', 'How many days does the “Business” site take?'],
  ['servicePage.nichesHeading', 'Pick your industry'],
  ['servicePage.nicheDemo', 'Open a sample site'],
  [
    'services.industry.niches.horeca.text',
    'A menu on the site where guests pick dishes with filters, a QR-code menu, a map with directions and opening hours',
  ],
  ['services.industry.faq.0.question', 'How is a site for your industry different from “Start”?'],
  ['services.industry.faq.2.question', 'How many days does a site for your industry take?'],
  ['servicePage.tryIt.apps.coffee.module', 'Bonuses'],
  [
    'services.miniApp.faq.3.answer',
    'A Telegram bot your customers open the app through, and an admin panel, the section where you change texts, photos and prices yourself and see bookings, orders and bonuses. Everything else included in the price is in the “What is included” list on this page. The exact deadline, 3 to 4 weeks from the day you pick the style, we name once we discuss your task and put it in the contract.',
  ],
  ['services.miniApp.process.0.title', 'The task, features and choosing a style'],
  ['services.miniApp.process.1.title', "The customer's steps and screen drawings"],
  [
    'services.miniApp.basics.items.0',
    'We write the app ourselves, in code, rather than putting it together in a builder. We hand over the source code, all the files the app, the bot and the admin panel are built from: you can change it and pass it to another developer without us',
  ],
  [
    'services.miniApp.basics.items.6',
    'Three rounds of revisions included. A round is all your comments in one list, and we make all of it. Revisions are texts, photos, the color of individual buttons and blocks, the order of screens; new screens, features and a whole new style are separate work',
  ],
  [
    'services.store.faq.0.answer',
    'The plan includes a catalog of up to 100 products. If you have more, we price the extra ones separately.',
  ],
  ['services.store.faq.1.question', 'Can customers pay for an order and choose delivery on the site?'],
  [
    'services.store.faq.1.answer',
    'Yes. A customer puts products in the cart, pays on the site and chooses delivery. You see the orders in the order admin panel, the section where you process them. Which service takes the payments (Stripe, for example) and which company delivers, we decide together when we discuss your task.',
  ],
  [
    'services.store.faq.2.answer',
    'Every store has its own catalog, simpler or more complex, and its own set of connections to other services, such as payment and delivery. We name the exact amount once we discuss your task.',
  ],
  ['services.store.process.2.title', 'We build the store'],
  [
    'services.mvp.faq.0.answer',
    'An MVP is the first working version of your service, with only the essentials. Users sign in with a login and password, and each has their own account. People can pay in the service, it is connected to the other services you need, and it collects statistics. With this version you can test the idea with real users.',
  ],
  [
    'services.mvp.faq.1.answer',
    'The deadline depends on how many different kinds of user accounts the service has (for example, for customers and for staff) and how many connections to other services it needs. We put the exact deadline in the contract once we discuss your task.',
  ],
  [
    'services.mvp.faq.2.answer',
    'You. We hand over the source code, all the files the service is built from, together with the passwords. With it you can change the service and move to another developer without us.',
  ],
  ['services.mvp.process.1.title', 'Design and how the service works'],
  ['services.mvp.process.2.title', 'We build the service in parts'],
  ['servicePage.threeD.tiersNote', 'Click a format and the quote opens with that format already selected'],
  ['services.threeD.process.1.title', 'The shape of the model and viewing angles'],
  ['services.threeD.process.2.title', 'The 3D scene and labels'],
  ['services.threeD.process.3.title', 'Loading image, phones, speed test'],
  [
    'services.threeD.faq.1.answer',
    'First the visitor sees a regular image of the model, and the 3D loads after it. If a phone cannot show 3D (it lacks the WebGL 2.0 technology), it shows an image and a video instead, and the inquiry form works either way. On a weak phone the model may rotate more slowly, but the image, the labels and the inquiry form are there right away.',
  ],
  ['services.threeD.faq.2.question', 'How much do revisions cost after three lists of comments?'],
  [
    'services.threeD.faq.3.answer',
    'No. We only work with sites written in code, not put together on Tilda, WordPress or 1C-Bitrix. We embed a 3D block into such a site: yours, if developers wrote it without a website builder, or one we built. If your site is on a website builder, we can make a 3D landing page, a separate page with its own address, such as 3d.yoursite.com, and link to it from your site.',
  ],
  [
    'services.threeD.faq.4.answer',
    'A 3D block is one 3D model that we embed into a site written in code: yours or one we built. A 3D landing page is a separate one-page site with the model at its center. We write the texts for it from your answers to our questions. The page has an inquiry form and everything from the “Included in the price of every site” list, site visit statistics included.',
  ],
  [
    'services.threeD.basics.note',
    'Included in both formats. A 3D landing page also gets everything from the “Included in the price of every site” list in the “Services and pricing” section: leads to Telegram and email, analytics, a layout that is easy to use on a phone, domain setup and more. You pay for the server directly to the provider (see the item below), and for the domain once a year to the registrar',
  ],
  [
    'services.threeD.basics.items.2',
    'The price covers up to 8 parts or mechanisms with labels; click any of them and the model zooms in on it. More parts or moving mechanisms cost more. How much more, we put in the estimate once we discuss your task, before the prepayment. After that the price in the contract does not change unless you yourself ask for a new part or a new viewing angle; then we name the extra cost before work starts',
  ],
  [
    'services.threeD.basics.items.3',
    'While the 3D loads, an image of the model is shown at the top of the page. Phones that cannot show 3D (no WebGL 2.0) show an image and a video instead of the model',
  ],
  [
    'services.threeD.basics.items.4',
    "The 3D block's files live on the same server your site runs on (your hosting). A 3D landing page needs its own server: you pay for it directly to the provider company, not to us, currently from 2,000 ₽ a month, but provider prices change",
  ],
  [
    'services.threeD.terms.items.0',
    'The deadline goes into the contract: 4 weeks for a 3D block, 6 weeks for a 3D landing page. Day one is the day we have the detailed description and the materials, and for a 3D landing page also the chosen style. While we wait for your reply or sign-off, the clock stops: the delivery date moves by the same number of days. If we build the model from scratch, that takes extra time; we name it before the prepayment, together with the price. If we are late through our fault, we cut the price by 2% for each day of delay, 20% at most. That amount comes off the final payment. It is calculated from the price you pay under the contract, options included',
  ],
  [
    'services.threeD.terms.items.1',
    'We approve the shape of the model and the viewing angles with you in the first week, before the 3D scene is built. A new part or a new viewing angle after that is separate work; we name the price before starting',
  ],
  [
    'services.threeD.terms.items.3',
    'We start one 3D project a month. We name the start date once we discuss your task, before the prepayment: if the date does not suit you, you pay nothing',
  ],
  [
    'services.threeD.webgl',
    'Browsers of about 97% of internet users worldwide can show 3D (the WebGL 2.0 technology), <link>according to Can I use</link>, a site with browser statistics, as of October 2026. Everyone else sees an image and a video instead of the scene',
  ],
  [
    'services.threeD.needs.items.0',
    'A 3D model of the product from a drawing program (CAD) in a common format: STEP, IGES and others. Or a ready model for websites in GLB format',
  ],
  [
    'services.threeD.tierPoints.block3d.0',
    'We embed it into a site written in code, not in a website builder: yours or one we built',
  ],
  [
    'services.threeD.tierPoints.block3d.1',
    'Labels for the parts, from your list; click a part and the model zooms in on it',
  ],
  ['services.threeD.tierPoints.block3d.2', 'An image while the 3D loads; a phone without 3D gets an image and a video'],
  [
    'services.threeD.tierPoints.landing3d.0',
    'We write the texts from your answers to our questions; inquiries go to Telegram and email',
  ],
  [
    'services.threeD.tierPoints.landing3d.1',
    'Everything that comes with any of our sites: a layout that is easy to use on a phone, getting ready for search, analytics, a cookie banner, your web address (domain) and a secure connection (SSL)',
  ],
  ['servicePage.support.tiersNote', 'Click a plan and the quote opens with that plan already selected'],
  ['services.support.process.1.title', "Updating the site's software"],
  ['services.support.basics.items.2', 'Backup copies of the site (backups)'],
  [
    'services.miniApp.lead',
    'The app opens right inside the messenger, Telegram or MAX, with nothing to download. In it, customers book appointments, browse the menu, collect bonuses and pay. It comes with a bot customers open the app through, and an admin panel, the section where you change texts and prices and see bookings and orders',
  ],
  [
    'services.miniApp.basics.items.9',
    'The deadline goes into the contract. If we are late through our fault, we cut the price by 2% for each day of delay, 20% at most. That amount comes off the final payment. It is calculated from the price you pay under the contract, options included',
  ],
  [
    'services.business.faq.0.answer',
    '“Business” has up to seven pages, while “Start” has one. There is a blog, a section for news and articles. A version of the site in a second language can be added for an extra fee. The admin panel, where you change texts, photos and prices yourself, comes with both “Business” and “Start”. “Business” differs from the site for your industry in that we design the pages and features for you from scratch rather than taking them from a demo. That is why it suits any business, not only a clinic, a cafe or an expert.',
  ],
  [
    'services.business.faq.5.answer',
    "Yes. We design the pages around your clinic: doctors, services and prices, for example. Russian Health Ministry Order No.\u00a0118n lists what a clinic website must have. Of that, we build three things at no extra cost: a version for the visually impaired, site search and a form where patients rate the quality of care. “Business” has up to seven pages. The form and search do not count toward them, and the page with the clinic information the order requires is one of the seven. The rest of what the order requires on the site, such as your license and doctors' details, we add from your documents, and after that you change doctors and prices yourself through the admin panel. It is best to check with a lawyer what exactly the order requires of your clinic. If the lawyer says you need a section the site does not have, we name the price before we start. Online booking, where a patient picks a doctor and a time, costs extra; the price is in the “Options” list on this page. Without it, a patient leaves a request on the site and it comes to your Telegram and email. For clinics we also have the “Site for your industry” plan: we take the sections from our demo and draw the design for you. It will be cheaper and faster than “Business” if those sections and appointment requests are enough for you: the “Site for your industry” plan has no online booking with a choice of time.",
  ],
  [
    'services.industry.faq.0.answer',
    '“Start” is a one-page site. The site for your industry has several pages with sections and features for your industry. For each industry on the list we have a demo, an example of a finished site. We take its structure: the sections and features your industry needs, such as a menu with filters for a cafe or doctors with prices for a clinic. The design is drawn for you: three styles to choose from, as in “Start”. If you like the style of the demo itself, you can take it. Either way the site is yours: with your texts, your photos and on your address. The site for your industry costs more than “Start” and takes longer: it has several pages and features for your industry, while “Start” is one page. It has as many pages as the demo for your industry; a new page is separate work. For a clinic we add a notice about contraindications and the license details, and you are responsible for the medical texts. The deadline is {term}.',
  ],
  [
    'services.landing.faq.3.answer',
    'Every plan includes schema.org, llms.txt, OG and hreflang, so the site is ready for AI search. For more, there is the “Extended pack for AI search” option — its contents and price are in the full price list. We do not promise a place in the results.',
  ],
];

/** Жаргон, которого нет в текстах услуг и цен: часть слова, нижний регистр; список утвердил Николай. */
const JARGON = ['lighthouse', 'критерий приемки', 'лидформ', 'сегментац', 'постер-кадр', 'поддомен', 'адаптив'];

/** Разделы ru.json с текстами страниц услуг и цен. */
const PLAIN_SECTIONS = ['services', 'servicePage', 'pricing'] as const;

/** Короткая подпись тарифа приложений в разделе цен — Николай ее оставил, лид страницы туда не попадает. */
const MINI_APP_PLAN_SUMMARY_RU = 'Запись, меню, лояльность и\u00a0оплата внутри мессенджера, бот и\u00a0админка';

/** Услуги без своего лида: подпись страницы — из прайса, как раньше. */
const WITHOUT_LEAD = ['landing', 'store'];

const LOCALES: Locale[] = ['ru', 'en'];

/** Пробелы любого вида (обычный, U+00A0, U+202F) — в обычный, затем нижний регистр. */
const folded = (text: string) => text.replace(/\s/g, ' ').toLowerCase();

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

const expectedText = (locale: Locale, path: string) => {
  const found = (locale === 'ru' ? APPROVED_RU : APPROVED_EN).find(([key]) => key === path);

  if (!found) {
    throw new Error(`нет утвержденного текста ${path} (${locale})`);
  }

  return found[1];
};

const Probe = ({ serviceId, onData }: ProbeProps) => {
  onData(useServicePage(serviceId));

  return null;
};

/** Данные страницы услуги так, как их получает разметка направления. */
const servicePageData = (locale: Locale, serviceId: string) => {
  let data: ServicePageData | null = null;

  renderToStaticMarkup(
    createElement(
      Provider,
      { locale, timeZone: 'Europe/Moscow', messages: MESSAGES[locale] },
      createElement(Probe, {
        serviceId,
        onData: (value) => {
          data = value;
        },
      }),
    ),
  );

  return data as ServicePageData | null;
};

describe('тексты услуг и цен в ru.json — дословно утвержденные', () => {
  it.each(APPROVED_RU)('%s', (path, expected) => {
    expect(valueAt(ru, path)).toBe(expected);
  });
});

describe('тексты услуг и цен в en.json — перевод утвержденных', () => {
  it.each(APPROVED_EN)('%s', (path, expected) => {
    expect(valueAt(en, path)).toBe(expected);
  });
});

describe('в текстах услуг и цен ru.json нет жаргона', () => {
  const entries = PLAIN_SECTIONS.flatMap((section) => entriesOf(ru[section], section));

  it.each(JARGON)('%s', (word) => {
    const found = entries.filter(({ text }) => folded(text).includes(word)).map(({ path }) => path);

    expect(found, `«${word}» в ключах ru.json`).toEqual([]);
  });
});

describe('лид страницы приложений — из своего ключа', () => {
  it.each(LOCALES)('%s: summary страницы miniApp — services.miniApp.lead, не подпись тарифа', (locale) => {
    const data = servicePageData(locale, 'miniApp');

    expect(data?.summary).toBe(expectedText(locale, 'services.miniApp.lead'));
    expect(data?.summary).not.toBe(valueAt(MESSAGES[locale], 'pricing.plans.miniApp.summary'));
  });
});

describe('страница без лида — подпись тарифа, как раньше', () => {
  const rows = LOCALES.flatMap((locale) => WITHOUT_LEAD.map((id) => [locale, id] as const));

  it.each(rows)('%s: summary страницы %s — pricing.plans.<id>.summary', (locale, id) => {
    const data = servicePageData(locale, id);

    expect(valueAt(MESSAGES[locale], `services.${id}.lead`)).toBeUndefined();
    expect(data?.summary).toBe(valueAt(MESSAGES[locale], `pricing.plans.${id}.summary`));
  });
});

describe('строка тарифа приложений в ценах — короткая', () => {
  it('pricing.plans.miniApp.summary в ru.json — короткая подпись, не лид страницы', () => {
    const summary = valueAt(ru, 'pricing.plans.miniApp.summary');

    expect(summary).toBe(MINI_APP_PLAN_SUMMARY_RU);
    expect(summary).not.toBe(expectedText('ru', 'services.miniApp.lead'));
  });
});
