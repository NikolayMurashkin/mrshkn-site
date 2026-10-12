import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsScripts } from '@/components/Analytics/AnalyticsScripts';
import { ConsentProvider } from '@/components/Analytics/ConsentProvider';
import type { ConsentProviderProps } from '@/components/Analytics/types';
import { clearedConsentCookie, consentCookie, parseConsent } from '@/lib/analytics/consent';
import { CONSENT_COOKIE, GOALS } from '@/lib/analytics/consts';
import { reachGoal } from '@/lib/analytics/goals';
import { getAnalyticsIds, getConsent } from '@/lib/analytics/server';

type ScriptMockProps = {
  id?: string;
  src?: string;
  children?: ReactNode;
  dangerouslySetInnerHTML?: { __html: string };
};

const cookieStore = vi.hoisted(() => ({ values: new Map<string, string>() }));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieStore.values.has(name) ? { name, value: cookieStore.values.get(name) } : undefined),
  }),
}));

vi.mock('next/script', () => ({
  default: ({ id, src, children, dangerouslySetInnerHTML }: ScriptMockProps) =>
    createElement('script', {
      id,
      src,
      dangerouslySetInnerHTML:
        dangerouslySetInnerHTML ?? (typeof children === 'string' ? { __html: children } : undefined),
    }),
}));

const METRIKA_ID = '12345678';
const GA_ID = 'G-TEST123';

const METRIKA_TAG = 'https://mc.yandex.ru/metrika/tag.js';
const GTAG_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
const GTAG_CONFIG = /gtag\(\s*['"]config['"]\s*,\s*['"]G-TEST123['"]/;

const ONE_YEAR_SECONDS = 31536000;

const markupOf = (props: Parameters<typeof AnalyticsScripts>[0]) =>
  renderToStaticMarkup(createElement(AnalyticsScripts, props));

const cookieParts = (cookie: string) => cookie.split(';').map((part) => part.trim());

const goalValues = () => Object.values(GOALS) as unknown[];

const anyGoal = () => {
  const [goal] = goalValues();

  expect(goal, 'в GOALS есть хотя бы одна цель').toBeTypeOf('string');

  return goal as string;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  cookieStore.values.clear();
});

describe('AnalyticsScripts: счетчики только после согласия', () => {
  it('A1: согласия нет — ни Метрики, ни GA4, ни одного скрипта', () => {
    const markup = markupOf({ consent: false, metrikaId: METRIKA_ID, gaId: GA_ID });

    expect(markup).not.toContain('mc.yandex.ru');
    expect(markup).not.toContain('googletagmanager.com');
    expect(markup).not.toContain('google-analytics.com');
    expect(markup).not.toContain(METRIKA_ID);
    expect(markup).not.toContain(GA_ID);
    expect(markup).not.toContain('<script');
  });

  it('A2: согласие дано — тег и инициализация Метрики, тег и config GA4', () => {
    const markup = markupOf({ consent: true, metrikaId: METRIKA_ID, gaId: GA_ID });

    expect(markup).toContain(METRIKA_TAG);
    expect(markup).toContain(METRIKA_ID);
    expect(markup).toContain(GTAG_SRC);
    expect(markup).toMatch(GTAG_CONFIG);
  });

  it('A3: согласие дано, ID счетчиков не заданы — разметка без скриптов', () => {
    expect(markupOf({ consent: true, metrikaId: null, gaId: null })).not.toContain('<script');
    expect(markupOf({ consent: true })).not.toContain('<script');
  });

  it('A4: согласие дано, задан один ID — только его счетчик', () => {
    const metrikaOnly = markupOf({ consent: true, metrikaId: METRIKA_ID, gaId: null });
    const gaOnly = markupOf({ consent: true, metrikaId: null, gaId: GA_ID });

    expect(metrikaOnly).toContain(METRIKA_TAG);
    expect(metrikaOnly).toContain(METRIKA_ID);
    expect(metrikaOnly).not.toContain('googletagmanager.com');

    expect(gaOnly).toContain(GTAG_SRC);
    expect(gaOnly).toMatch(GTAG_CONFIG);
    expect(gaOnly).not.toContain('mc.yandex.ru');
  });
});

describe('cookie согласия', () => {
  it('C1: parseConsent узнает granted и denied', () => {
    expect(parseConsent('granted')).toBe('granted');
    expect(parseConsent('denied')).toBe('denied');
  });

  it('C2: parseConsent от пустого и чужого значения — null: баннер показан, счетчики выключены', () => {
    for (const value of [undefined, null, '', 'yes', 'GRANTED']) {
      expect(parseConsent(value), `parseConsent(${JSON.stringify(value)})`).toBeNull();
    }
  });

  it.each(['granted', 'denied'] as const)('C3: consentCookie(%s) — на весь сайт, на год, SameSite=Lax', (choice) => {
    const cookie = consentCookie(choice);
    const parts = cookieParts(cookie);
    const attributes = parts.slice(1).map((part) => part.toLowerCase());

    expect(typeof cookie).toBe('string');
    expect(CONSENT_COOKIE.length, 'имя cookie задано').toBeGreaterThan(0);
    expect(parts[0]).toBe(`${CONSENT_COOKIE}=${choice}`);
    expect(attributes).toContain('path=/');
    expect(attributes).toContain(`max-age=${ONE_YEAR_SECONDS}`);
    expect(attributes).toContain('samesite=lax');
  });
});

describe('цели счетчиков', () => {
  it('G1: четыре цели — непустые разные строки', () => {
    const goals = goalValues();

    expect(goals).toHaveLength(4);
    for (const goal of goals) {
      expect(goal).toBeTypeOf('string');
      expect((goal as string).length).toBeGreaterThan(0);
    }
    expect(new Set(goals).size).toBe(4);
  });

  it('G2: счетчики не загружены — reachGoal не бросает', () => {
    const goal = anyGoal();

    vi.stubGlobal('window', {});

    expect(() => reachGoal(goal, METRIKA_ID)).not.toThrow();
  });

  it('G3: счетчики загружены — цель уходит в Метрику и GA4 по разу', () => {
    const goal = anyGoal();
    const ym = vi.fn();
    const gtag = vi.fn();

    vi.stubGlobal('window', { ym, gtag });

    reachGoal(goal, METRIKA_ID);

    expect(ym).toHaveBeenCalledOnce();
    expect(ym).toHaveBeenCalledWith(METRIKA_ID, 'reachGoal', goal);
    expect(gtag).toHaveBeenCalledOnce();
    expect(gtag).toHaveBeenCalledWith('event', goal);
  });

  it('G4: ID Метрики нет — в Метрику не шлет, в GA4 шлет', () => {
    const goal = anyGoal();
    const ym = vi.fn();
    const gtag = vi.fn();

    vi.stubGlobal('window', { ym, gtag });

    reachGoal(goal, null);

    expect(ym).not.toHaveBeenCalled();
    expect(gtag).toHaveBeenCalledOnce();
    expect(gtag).toHaveBeenCalledWith('event', goal);
  });

  it('G5: window нет (рендер на сервере) — reachGoal не бросает', () => {
    const goal = anyGoal();

    expect(typeof window).toBe('undefined');
    expect(() => reachGoal(goal, METRIKA_ID)).not.toThrow();
  });
});

describe('правка после RED: проверка ID, cookie на сервере, провайдер согласия', () => {
  it('A5: согласие дано, ID чужого формата — ни одного скрипта', () => {
    for (const metrikaId of ['1);alert(1)//', 'abc', '12 34', '1234567890123']) {
      expect(markupOf({ consent: true, metrikaId, gaId: null }), `metrikaId ${metrikaId}`).not.toContain('<script');
    }

    for (const gaId of ["G-TEST');alert(1)//", 'g-test123', 'UA-12345-1', 'G-']) {
      expect(markupOf({ consent: true, metrikaId: null, gaId }), `gaId ${gaId}`).not.toContain('<script');
    }
  });

  it('E1: getAnalyticsIds — ID из переменных среды своего формата, остальное null', () => {
    vi.stubEnv('METRIKA_ID', ' 12345678 ');
    vi.stubEnv('GA4_ID', 'G-TEST123');
    expect(getAnalyticsIds()).toEqual({ metrikaId: '12345678', gaId: 'G-TEST123' });

    for (const [metrika, ga] of [
      ['', ''],
      ['   ', '   '],
      ['1);alert(1)//', "G-TEST');alert(1)//"],
      ['abc', 'g-test123'],
    ]) {
      vi.stubEnv('METRIKA_ID', metrika);
      vi.stubEnv('GA4_ID', ga);
      expect(getAnalyticsIds(), `METRIKA_ID=${JSON.stringify(metrika)}, GA4_ID=${JSON.stringify(ga)}`).toEqual({
        metrikaId: null,
        gaId: null,
      });
    }
  });

  it('C4: clearedConsentCookie стирает выбор на весь сайт', () => {
    const parts = cookieParts(clearedConsentCookie());
    const attributes = parts.slice(1).map((part) => part.toLowerCase());

    expect(parts[0]).toBe(`${CONSENT_COOKIE}=`);
    expect(attributes).toContain('path=/');
    expect(attributes).toContain('max-age=0');
  });

  it('C5: getConsent читает выбор из cookie CONSENT_COOKIE', async () => {
    expect(await getConsent()).toBeNull();

    cookieStore.values.set(CONSENT_COOKIE, 'granted');
    expect(await getConsent()).toBe('granted');

    cookieStore.values.set(CONSENT_COOKIE, 'denied');
    expect(await getConsent()).toBe('denied');

    cookieStore.values.set(CONSENT_COOKIE, 'whatever');
    expect(await getConsent()).toBeNull();
  });

  it.each([
    [null, false],
    ['denied', false],
    ['granted', true],
  ] as const)('W1: ConsentProvider с выбором %s — счетчики: %s', (initialChoice, counting) => {
    const markup = renderToStaticMarkup(
      createElement(
        ConsentProvider,
        { initialChoice, metrikaId: METRIKA_ID, gaId: GA_ID } as ConsentProviderProps,
        'page',
      ),
    );

    expect(markup).toContain('page');
    if (counting) {
      expect(markup).toContain(METRIKA_TAG);
      expect(markup).toContain(GTAG_SRC);
    } else {
      expect(markup).not.toContain('<script');
    }
  });
});
