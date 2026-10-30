import { NextIntlClientProvider } from 'next-intl';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useServicePage } from '@/components/ServicePage/use-service-page';
import type { ServicePageData } from '@/components/ServicePage/types';
import { planHref } from '@/content/format';
import { PRICING_OPTIONS, PRICING_PLANS } from '@/content/pricing';
import { getServiceBySlug, SERVICES, serviceBriefHref } from '@/content/services';
import { routing } from '@/i18n/routing';
import { BRIEF_STEP_VALUES } from '@/lib/brief/consts';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

const PLAN_ROWS = routing.locales.flatMap((locale) => PRICING_PLANS.map((plan) => [locale, plan.id, plan] as const));

/** Отраслевое Mini App своей страницы не имеет: его карточка ведет на готовые решения страницы Telegram-приложений. */
const WITHOUT_PAGE = ['industryMiniApp'];

/** «Что входит» у приложений в Telegram — свой список, утвержденный дословно (ru). */
const MINI_APP_BASICS_RU = {
  note: 'Входит в\u00a0цену приложения',
  items: [
    'Приложение пишем сами, программным кодом, а\u00a0не\u00a0собираем в\u00a0конструкторе. Исходный код\u00a0— все файлы, из\u00a0которых собраны приложение, бот и\u00a0админка,\u00a0— передаем вам: менять его и\u00a0передать другому разработчику можете без нас',
    'Бот в\u00a0Telegram, через который клиенты открывают приложение',
    'Админка\u00a0— раздел, где вы сами меняете тексты, фото и\u00a0цены, смотрите записи, заказы и\u00a0бонусы',
    'Новые записи и\u00a0заказы приходят вам в\u00a0Telegram',
    'Политика обработки данных по\u00a0закону о\u00a0персональных данных (152-ФЗ). До\u00a0договора скажем, что еще нужно сделать вам',
    'Сервер\u00a0— компьютер в\u00a0интернете, на\u00a0котором работает приложение. Мы его настраиваем и\u00a0передаем вам. Платите за\u00a0него напрямую компании-провайдеру, не\u00a0нам: сейчас от\u00a02\u00a0000\u00a0₽ в\u00a0месяц, но\u00a0цены провайдеров меняются. Еще приложению нужен свой адрес в\u00a0интернете. Есть у\u00a0вас сайт\u00a0— бесплатно ставим приложение на\u00a0адрес внутри него, например app.вашсайт.ru. Сайта нет\u00a0— домен (адрес) покупаете сами у\u00a0регистратора, как для сайта, и\u00a0платите ему раз в\u00a0год, обычно несколько сотен рублей. Если приложение принимает оплату, платежный сервис берет комиссию с\u00a0каждого платежа, договор с\u00a0ним тоже на\u00a0вас. До\u00a0договора посчитаем, сколько за\u00a0год выйдут сервер и\u00a0домен, и\u00a0скажем, какой процент берет платежный сервис',
    'Три раунда правок в\u00a0цене. Раунд\u00a0— это все ваши замечания одним списком, мы вносим его целиком. Правки\u00a0— это тексты, фото, цвет отдельных кнопок и\u00a0блоков, порядок экранов; новые экраны, функции и\u00a0смена стиля целиком\u00a0— отдельная работа',
    'Год гарантии со\u00a0дня приемки: бесплатно чиним все, что сломалось по\u00a0нашей вине или работает не\u00a0так, как записано в\u00a0договоре. Сбои самих Telegram и\u00a0MAX не\u00a0входят',
    'Инструкция и\u00a0видео с\u00a0экрана: как работать в\u00a0админке',
    'Срок записываем в\u00a0договор. Опоздали по\u00a0нашей вине\u00a0— за\u00a0каждый день просрочки снижаем цену на\u00a02\u00a0%, всего не\u00a0больше чем на\u00a020\u00a0%. Эту сумму вычитаем из\u00a0последнего платежа. Считаем от\u00a0цены, которую вы платите по\u00a0договору, вместе с\u00a0опциями',
  ],
};

type Messages = typeof ru;

type ProviderProps = { locale: string; timeZone: string; messages: Messages; children?: ReactNode };

type ProbeProps = { serviceId: string; onData: (data: ServicePageData | null) => void };

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const MESSAGES: Record<string, Messages> = { ru, en: en as Messages };

/** Свои списки «что входит» прежних услуг: у поддержки — работы за месяц, у 3D — сцена и встраивание. */
const OWN_BASICS_BEFORE = ['threeD', 'support'];

/** Услуги сайтов и приложений под заказ: «что входит» — общая база тарифа. */
const COMMON_BASICS = ['landing', 'industry', 'business', 'store', 'mvp'];

const Probe = ({ serviceId, onData }: ProbeProps) => {
  onData(useServicePage(serviceId));

  return null;
};

/** Данные страницы услуги так, как их получает разметка направления. */
const servicePageData = (locale: string, serviceId: string) => {
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

const PAGE_PLANS = PRICING_PLANS.filter((plan) => !WITHOUT_PAGE.includes(plan.id));

/** Логотип — не сайт: опций сайта к нему нет, список пустой. */
const WITHOUT_OPTIONS = ['logo'];

describe('страницы услуг покрывают все тарифы', () => {
  it.each(PLAN_ROWS)('%s, %s: адрес тарифа из прайса есть среди страниц услуг', (locale, _id, plan) => {
    const pages = new Set(routing.locales.flatMap((l) => SERVICES.map((service) => `/${l}/${service.slug}`)));

    expect(pages.has(planHref(locale, plan).split(/[?#]/)[0])).toBe(true);
  });

  it('справочник услуг: id как у тарифов со своей страницей, slug как у своего тарифа, слаги уникальны', () => {
    expect(SERVICES.map((service) => service.id).sort()).toEqual(PAGE_PLANS.map((plan) => plan.id).sort());

    for (const service of SERVICES) {
      expect(service.slug).toBe(PRICING_PLANS.find((plan) => plan.id === service.id)?.slug);
    }

    expect(new Set(SERVICES.map((service) => service.slug)).size).toBe(SERVICES.length);
  });

  it.each(PAGE_PLANS.map((plan) => [plan.slug, plan.id]))('getServiceBySlug(%s) отдает услугу %s', (slug, id) => {
    const service = getServiceBySlug(slug);

    expect(service?.slug).toBe(slug);
    expect(service?.id).toBe(id);
  });

  it.each(['bogus', '', 'brief', 'work', 'Landing'])(
    'getServiceBySlug(%j) — undefined, страница отдаст 404',
    (slug) => {
      expect(getServiceBySlug(slug)).toBeUndefined();
    },
  );

  it.each(PAGE_PLANS.map((plan) => [plan.id]))('%s: опции услуги — непустой список без дублей из прайса', (id) => {
    const service = SERVICES.find((item) => item.id === id);
    const optionIds = PRICING_OPTIONS.map((option) => option.id);

    expect(service).toBeDefined();

    if (WITHOUT_OPTIONS.includes(id)) {
      expect(service!.options).toEqual([]);
    } else {
      expect(service!.options.length).toBeGreaterThan(0);
    }

    expect(new Set(service!.options).size).toBe(service!.options.length);

    for (const option of service!.options) {
      expect(optionIds).toContain(option);
    }
  });

  const BRIEF_ROWS = routing.locales.flatMap((locale) => PAGE_PLANS.map((plan) => [locale, plan.id] as const));

  it.each(BRIEF_ROWS)('%s, %s: CTA ведет в квиз с предвыбором этой услуги', (locale, id) => {
    const service = SERVICES.find((item) => item.id === id);

    expect(service).toBeDefined();
    expect(serviceBriefHref(locale, service!)).toBe(`/${locale}/brief?plan=${id}`);
    expect(BRIEF_STEP_VALUES.product).toContain(id);
  });
});

describe('«что входит» на странице услуги', () => {
  it('ru, miniApp: свой список — утвержденные пояснение и десять пунктов по порядку', () => {
    expect(servicePageData('ru', 'miniApp')?.ownBasics).toEqual(MINI_APP_BASICS_RU);
  });

  it('en, miniApp: свой список из перевода — пояснение и десять пунктов по порядку', () => {
    const basics = (en.services.miniApp as { basics?: { note: string; items: string[] } }).basics;

    expect(basics?.items).toHaveLength(10);
    expect(basics?.note).toMatch(/\S/);
    expect(servicePageData('en', 'miniApp')?.ownBasics).toEqual(basics);
  });

  it.each(routing.locales.flatMap((locale) => COMMON_BASICS.map((id) => [locale, id] as const)))(
    '%s, %s: своего списка нет — общая база тарифа',
    (locale, id) => {
      const data = servicePageData(locale, id);

      expect(data?.service.id).toBe(id);
      expect(data?.ownBasics).toBeNull();
    },
  );

  it.each(routing.locales.flatMap((locale) => OWN_BASICS_BEFORE.map((id) => [locale, id] as const)))(
    '%s, %s: свой список — как в переводе',
    (locale, id) => {
      const services = MESSAGES[locale].services as Record<string, { basics?: unknown }>;

      expect(servicePageData(locale, id)?.ownBasics).toEqual(services[id].basics);
    },
  );
});
