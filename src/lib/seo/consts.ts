import { PRICING_PLANS } from '@/content/pricing';
import type { SiteLocale } from '@/i18n/types';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { PRIVACY_HREF, SITE_URL } from '@/lib/consts';
import defaultMessages from '../../../messages/ru.json';
import type { PriceCurrency } from './types';

/**
 * Статические индексируемые страницы без префикса языка: главная, страница каждой услуги, квиз, политика ПД.
 * «Спасибо» квиза закрыта от индекса, кейсы приходят из CMS — их в списке нет.
 */
export const SITE_PAGES: readonly string[] = [
  '',
  ...PRICING_PLANS.map((plan) => `/${plan.slug}`),
  BRIEF_HREF,
  PRIVACY_HREF,
];

/** Ключ hreflang для версии по умолчанию: ведет на язык `DEFAULT_LOCALE`. */
export const X_DEFAULT = 'x-default';

export const BRAND_NAME = defaultMessages.brand.name;

export const STUDIO_EMAIL = 'hello@mrshkn.com';

/** Код подтверждения прав в Яндекс Вебмастере для mrshkn.com: метатег `yandex-verification`. */
export const YANDEX_VERIFICATION = '84f12e223dadf5bb';

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** Растровый знак студии для `Organization.logo`: SVG поисковики там не принимают. */
export const LOGO_PATH = '/logo.png';

export const LOGO_SIZE = { width: 512, height: 512 };

export const LLMS_FULL_PATH = '/llms-full.txt';

export const PRICE_CURRENCY: Record<SiteLocale, PriceCurrency> = {
  ru: { code: 'RUB', amount: 'rub' },
  en: { code: 'USD', amount: 'usd' },
};

export const OG_LOCALES: Record<SiteLocale, string> = { ru: 'ru_RU', en: 'en_US' };

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_CONTENT_TYPE = 'image/png';

/** Темная тема Kinetic (`src/styles/designs/kinetic.scss`): Satori не читает CSS-переменные. */
export const OG_COLORS = {
  bg: '#121114',
  ink: '#f1efe9',
  muted: '#9d9a93',
  accent: '#ff6a2b',
  accentContrast: '#151317',
};

/**
 * Начертания статичных TTF из `scripts/subset-fonts.mjs` по стилям DS Kinetic: заголовок и знак — Unbounded 900,
 * подпись — Golos Text 400 (`lead`), плашка — Golos Text 600 (`Tag`). Пути к файлам — литералами в `og.tsx`.
 */
export const OG_FONTS = {
  display: { name: 'Unbounded', weight: 900 },
  text: { name: 'Golos Text', weight: 400 },
  tag: { name: 'Golos Text', weight: 600 },
} as const;

/** Подпись под заголовком картинки — не длиннее стольких строк. */
export const OG_DESCRIPTION_LINES = 3;

/** Кегль заголовка картинки по длине: короткое название крупно, длинное название кейса — мельче, но целиком. */
export const OG_TITLE_SIZES = [
  { maxLength: 20, fontSize: 84 },
  { maxLength: 40, fontSize: 68 },
  { maxLength: 70, fontSize: 54 },
  { maxLength: Infinity, fontSize: 42 },
];

export const TEXT_CONTENT_TYPE = 'text/plain; charset=utf-8';
