import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { initialBriefAnswers } from '@/components/Brief/initial-answers';
import { DESIGN_NAMES } from '@/designs/consts';
import { EditorialSection } from '@/designs/editorial';
import { KineticSection } from '@/designs/kinetic';
import { PopSection } from '@/designs/pop';
import { SwissSection } from '@/designs/swiss';
import { TerminalSection } from '@/designs/terminal';
import type { DesignName, SectionProps } from '@/designs/types';
import { HONEYPOT_FIELD } from '@/lib/brief/consts';
import { formatLead, parseLead } from '@/lib/brief/lead';
import { parseBriefPreset } from '@/lib/brief/preset';
import ru from '../../messages/ru.json';

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/ru/brief',
  useParams: () => ({ locale: 'ru' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

type ProviderProps = { locale: string; timeZone: string; messages: unknown; children?: ReactNode };

const SECTIONS: Record<DesignName, (props: SectionProps) => ReactNode> = {
  kinetic: KineticSection,
  terminal: TerminalSection,
  pop: PopSection,
  swiss: SwissSection,
  editorial: EditorialSection,
};

const TIERS = ['block3d', 'landing3d'] as const;

const TIER_NAMES = ['3D-блок', '3D-лендинг'];

const CONTEXT = { marks: {}, page: '/ru/brief' };

const INPUT = {
  product: 'threeD',
  niche: 'startup',
  design: 'kinetic',
  timing: 'month',
  budget: 'to500',
  name: 'Иван',
  contact: '@ivan',
  comment: '',
  consent: true,
  [HONEYPOT_FIELD]: '',
};

const NBSP = String.fromCodePoint(0x00a0);

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const textOf = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replaceAll(NBSP, ' ')
    .trim();

const renderBrief = (design: DesignName, plan: string) =>
  renderToStaticMarkup(
    createElement(
      Provider,
      { locale: 'ru', timeZone: 'Europe/Moscow', messages: ru },
      SECTIONS[design]({ section: 'brief', design, plan, niche: null } as SectionProps),
    ),
  );

/** Ответы, которые направление отметило выбранными: кнопка `aria-pressed`, пункт `aria-checked` или `checked`. */
const selectedTexts = (html: string) =>
  [
    ...html.matchAll(
      /<(button|label|li|div|a)\b([^>]*\b(?:aria-pressed="true"|aria-checked="true"|checked="")[^>]*)>([\s\S]*?)<\/\1>/g,
    ),
  ].map(([, , , inner]) => textOf(inner));

/** Тексты всех ответов на шаге: кнопки и пункты с маркером выбора. */
const optionTexts = (html: string) =>
  [
    ...html.matchAll(
      /<(button|label|li|div|a)\b([^>]*\b(?:aria-pressed|aria-checked|data-testid="brief-option")[^>]*)>([\s\S]*?)<\/\1>/g,
    ),
  ].map(([, , , inner]) => textOf(inner));

const optionValues = (html: string) => [...html.matchAll(/\sdata-value="([^"]*)"/g)].map(([, value]) => value);

const lead = (overrides: Record<string, unknown>) => parseLead({ ...INPUT, ...overrides }, CONTEXT);

describe('квиз принимает варианты услуги «3D-интерактив»', () => {
  it.each(TIERS)('адрес с plan=%s предвыбирает этот вариант', (plan) => {
    expect(parseBriefPreset({ plan })).toEqual({ plan, niche: null });
  });

  it.each(TIERS)('с plan=%s на первом шаге выбрана услуга threeD', (plan) => {
    expect(initialBriefAnswers({ design: 'kinetic', plan, niche: null }).product).toBe('threeD');
  });

  it('plan=threeD выбирает threeD, обычный тариф выбирает сам себя', () => {
    expect(initialBriefAnswers({ design: 'kinetic', plan: 'threeD', niche: null }).product).toBe('threeD');
    expect(initialBriefAnswers({ design: 'kinetic', plan: 'landing', niche: null }).product).toBe('landing');
  });

  const RENDER_ROWS = DESIGN_NAMES.flatMap((design) => TIERS.map((plan) => [design, plan] as const));

  it.each(RENDER_ROWS)(
    '%s, plan=%s: на первом шаге отмечен пункт «3D-интерактив», отдельного ответа под вариант нет',
    (design, plan) => {
      const html = renderBrief(design, plan);

      expect(selectedTexts(html)).toEqual(['3D-интерактив']);

      for (const name of TIER_NAMES) {
        expect(optionTexts(html), `ответ «${name}»`).not.toContain(name);
      }

      expect(optionValues(html)).not.toContain('block3d');
      expect(optionValues(html)).not.toContain('landing3d');
    },
  );

  it.each(TIERS)('заявка с product=threeD и plan=%s хранит вариант и пишет его в текст', (plan) => {
    const result = lead({ plan });

    expect(result).toMatchObject({ ok: true, lead: { product: 'threeD', plan } });
    expect(result.ok ? formatLead(result.lead) : '').toContain(`plan=${plan}`);
  });

  it('чужой вариант plan=block4d не предвыбирается и не попадает в заявку, заявка собирается', () => {
    expect(parseBriefPreset({ plan: 'block4d' })).toEqual({ plan: null, niche: null });
    expect(lead({ plan: 'block4d' })).toMatchObject({ ok: true, lead: { product: 'threeD', plan: null } });
  });
});
