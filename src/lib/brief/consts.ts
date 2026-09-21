import { PRICING_PLANS } from '@/content/pricing';
import type { BriefChoice } from './types';

/** Пять шагов квиза в порядке прохождения; на четвертом два вопроса, на пятом контакты. */
export const BRIEF_STEPS = ['product', 'niche', 'design', 'scope', 'contacts'] as const;

/** Что выбирают на шаге «стиль» помимо пяти направлений: человек имеет право не выбирать. */
export const BRIEF_ANY_DESIGN = 'any';

/** Справочники ответов: значение вне списка на сервер не проходит. Продукты — те же, что в прайсе. */
export const BRIEF_STEP_VALUES: Record<BriefChoice, readonly string[]> = {
  product: [...PRICING_PLANS.map((plan) => plan.id), 'other'],
  niche: ['clinic', 'expert', 'horeca', 'startup', 'other'],
  design: ['kinetic', 'terminal', 'pop', 'swiss', 'editorial', BRIEF_ANY_DESIGN],
  timing: ['asap', 'twoWeeks', 'month', 'noRush'],
  budget: ['upTo100', 'to250', 'to500', 'over500', 'unknown'],
};

export const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

/** Метки живут в cookie, потому что человек приходит по рекламе на главную, а заявку оставляет на брифе. */
export const UTM_COOKIE = 'marks';

export const UTM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const LEAD_SOURCE = 'site';

/**
 * Поле-приманка: человек его не видит, бот заполняет. Имя нарочно вне словаря автозаполнения —
 * на `company` браузер подставил бы организацию живому человеку, и его заявка молча пропала бы.
 */
export const HONEYPOT_FIELD = 'zone';

export const LEAD_RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

/** Сколько адресов помнит лимитер, прежде чем выбросить протухшие. */
export const RATE_LIMIT_MAX_KEYS = 1000;

export const NAME_MAX_LENGTH = 120;

export const CONTACT_MAX_LENGTH = 120;

export const COMMENT_MAX_LENGTH = 2000;

/** Метка длиннее этого не нужна никому: cookie раздувается, а текст заявки упирается в лимит Telegram. */
export const MARK_MAX_LENGTH = 128;

/** Адрес квиза без локали: `Link` из next-intl сам добавит префикс языка. */
export const BRIEF_HREF = '/brief';

export const THANKS_HREF = '/brief/thanks';
