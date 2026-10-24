import { createTranslator } from 'next-intl';
import { planTerm } from '@/content/format';
import { SERVICE_PLANS, serviceFaq } from '@/content/services';
import type { PricingPlan } from '@/content/types';
import type { SiteLocale } from '@/i18n/types';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { SITE_URL } from '@/lib/consts';
import { localePath } from './alternates';
import { BRAND_NAME, LLMS_FULL_PATH, TEXT_CONTENT_TYPE } from './consts';
import { planPriceText } from './price';
import type { LocaleMessages, PlanEntry, SeoMessages } from './types';

const pageUrl = (locale: SiteLocale, path: string) => `${SITE_URL}${localePath(locale, path)}`;

const link = (title: string, url: string, note?: string) => `- [${title}](${url})${note ? `: ${note}` : ''}`;

/** Тарифы со своей страницей услуги, у которых есть тексты на этом языке. */
const plansOf = (messages: SeoMessages): PlanEntry[] =>
  SERVICE_PLANS.flatMap((plan) => {
    const texts = messages.pricing.plans[plan.id];

    return texts ? [{ plan, texts }] : [];
  });

const priceText = ({ locale, messages }: LocaleMessages, plan: PricingPlan) =>
  planPriceText(createTranslator({ locale, messages, namespace: 'pricing.price' }), plan, locale);

/** H1 и цитата по llmstxt.org; описание остальных языков — абзацем под цитатой. */
const intro = ([first, ...rest]: LocaleMessages[]) => [
  `# ${BRAND_NAME}`,
  '',
  `> ${first.messages.meta.description}`,
  '',
  ...rest.flatMap(({ messages }) => [messages.meta.description, '']),
];

const briefLink = ({ locale, messages }: LocaleMessages) =>
  link(messages.brief.meta.title, pageUrl(locale, BRIEF_HREF), messages.brief.meta.description);

export const llmsText = (languages: LocaleMessages[]) =>
  [
    ...intro(languages),
    ...languages.flatMap((language) => [
      `## ${language.messages.nav.services}`,
      '',
      ...plansOf(language.messages).map(({ plan, texts }) =>
        link(texts.name, pageUrl(language.locale, `/${plan.slug}`), texts.summary),
      ),
      briefLink(language),
      link(LLMS_FULL_PATH.slice(1), `${SITE_URL}${LLMS_FULL_PATH}`),
      '',
    ]),
  ].join('\n');

const fullPlan = (language: LocaleMessages, { plan, texts }: PlanEntry) => {
  const { messages, locale } = language;
  const faq = serviceFaq(messages.services[plan.id]?.faq, plan.id, locale);

  return [
    `## ${texts.name}`,
    '',
    texts.summary,
    '',
    `- ${messages.pricing.columns.term}: ${planTerm(plan, locale, () => texts.term ?? '')}`,
    `- ${messages.pricing.columns.price}: ${priceText(language, plan)}`,
    link(texts.name, pageUrl(locale, `/${plan.slug}`)),
    '',
    ...(faq.length > 0
      ? [
          `### ${messages.servicePage.faqHeading}`,
          '',
          ...faq.flatMap(({ question, answer }) => [`**${question}**`, '', answer, '']),
        ]
      : []),
  ];
};

/** Полная версия: по каждой услуге срок, цена и весь FAQ, без CMS. */
export const llmsFullText = (languages: LocaleMessages[]) =>
  [
    ...intro(languages),
    ...languages.flatMap((language) => [
      ...plansOf(language.messages).flatMap((entry) => fullPlan(language, entry)),
      briefLink(language),
      '',
    ]),
  ].join('\n');

export const textResponse = (body: string) => new Response(body, { headers: { 'content-type': TEXT_CONTENT_TYPE } });
