// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReviewProps } from '@/components/Review/types';
import { SECTION_NAMES } from '@/designs/consts';
import { EditorialSection } from '@/designs/editorial';
import { KineticSection } from '@/designs/kinetic';
import { KineticReview } from '@/designs/kinetic/KineticReview';
import { PopSection } from '@/designs/pop';
import { SwissSection } from '@/designs/swiss';
import { TerminalSection } from '@/designs/terminal';
import type { SectionProps } from '@/designs/types';
import { reviewView } from '@/lib/review/state';
import type { ReviewStateRecord } from '@/lib/review/types';
import messages from '../../messages/ru.json';

/**
 * Страница отзыва по личной ссылке: по состоянию кода — форма, «отзыв получен» или «ссылка недействительна».
 * Неизвестный, просроченный и отозванный код неотличимы, форма без обеих отметок не уходит.
 */

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/review/invite-code',
  Link: ({ children }: { children: ReactNode }) => children,
}));

const DAY_MS = 24 * 60 * 60 * 1000;

const NOW = new Date('2026-10-13T12:00:00.000Z');

const at = (shift: number) => new Date(NOW.getTime() + shift).toISOString();

const CODE = 'invite-code';

const VIEW_IDS = ['review-form', 'review-received', 'review-invalid'] as const;

const FIELD_IDS = [
  'review-full-name',
  'review-signature',
  'review-occupation',
  'review-link',
  'review-answer-before',
  'review-answer-process',
  'review-answer-after',
  'review-consent',
  'review-license',
  'review-no-transfer',
  'review-no-link',
  'review-other',
  'review-submit',
] as const;

const FILLED = {
  'review-full-name': 'Белова Ирина Сергеевна',
  'review-signature': 'Ирина, кофейня у моста',
  'review-occupation': 'Владелица кофейни',
  'review-link': 'https://zerno.example.com',
  'review-answer-before': 'Пришли за сайтом с записью',
  'review-answer-process': 'Созванивались раз в неделю',
  'review-answer-after': 'Заявок стало вдвое больше',
  'review-other': 'Не цитировать в рекламе',
};

const DESIGN_SECTIONS = [
  ['kinetic', KineticSection],
  ['terminal', TerminalSection],
  ['pop', PopSection],
  ['swiss', SwissSection],
  ['editorial', EditorialSection],
] as const;

const mockMatchMedia = () =>
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

const withIntl = (node: ReactNode) => (
  <NextIntlClientProvider
    locale="ru"
    timeZone="Europe/Moscow"
    messages={messages}
  >
    {node}
  </NextIntlClientProvider>
);

const renderReview = (props: ReviewProps) => render(withIntl(<KineticReview {...props} />));

const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

const presentViews = () => VIEW_IDS.filter((id) => byTestId(id));

const leaves = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  return value && typeof value === 'object' ? Object.values(value).flatMap(leaves) : [];
};

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

const RU_STRINGS = new Set(leaves(messages).map(normalize));

/** Все поля формы заполнены, отметки не тронуты. */
const fillForm = (skip: readonly string[] = []) => {
  expect(
    FIELD_IDS.filter((id) => !byTestId(id)),
    'поля формы без разметки',
  ).toEqual([]);

  for (const [id, value] of Object.entries(FILLED)) {
    if (!skip.includes(id)) {
      fireEvent.change(byTestId(id) as HTMLElement, { target: { value } });
    }
  }
};

const toggle = (id: string) => fireEvent.click(byTestId(id) as HTMLElement);

/** Попытка отправить форму и кнопкой, и событием submit формы. */
const trySubmit = () => {
  const submit = byTestId('review-submit') as HTMLButtonElement;

  fireEvent.click(submit);

  const form = submit.closest('form');

  if (form) {
    fireEvent.submit(form);
  }
};

const respondWith = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

beforeEach(() => {
  window.matchMedia = mockMatchMedia() as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('состояние ссылки-приглашения', () => {
  it('H1: reviewView раскладывает запись по трем видам', () => {
    const rows: [string, ReviewStateRecord | null, string][] = [
      ['нет записи', null, 'invalid'],
      ['согласие отозвано', { status: 'withdrawn', sentAt: at(-DAY_MS), expiresAt: at(DAY_MS) }, 'invalid'],
      ['срок истек 1 мс назад', { status: 'invited', sentAt: at(-60 * DAY_MS), expiresAt: at(-1) }, 'invalid'],
      ['в сроке еще сутки', { status: 'invited', sentAt: at(-59 * DAY_MS), expiresAt: at(DAY_MS) }, 'form'],
      ['не отправлено', { status: 'invited', sentAt: null, expiresAt: at(DAY_MS) }, 'invalid'],
      ['получен', { status: 'received', sentAt: at(-DAY_MS), expiresAt: at(DAY_MS) }, 'received'],
      ['опубликован', { status: 'published', sentAt: at(-DAY_MS), expiresAt: at(DAY_MS) }, 'received'],
      ['отклонен', { status: 'rejected', sentAt: at(-DAY_MS), expiresAt: at(DAY_MS) }, 'received'],
    ];

    expect(Object.fromEntries(rows.map(([label, record]) => [label, reviewView(record, NOW)]))).toEqual(
      Object.fromEntries(rows.map(([label, , view]) => [label, view])),
    );
  });
});

describe('форма отзыва Kinetic', () => {
  it.each([
    ['form', 'review-form'],
    ['received', 'review-received'],
    ['invalid', 'review-invalid'],
  ] as const)('H2: вид %s рисует только %s', (view, testId) => {
    renderReview({ view, code: CODE, project: 'Northwind Bakery' });

    expect(presentViews()).toEqual([testId]);
  });

  it('H2: у формы все поля, оба документа из ru.json, запреты и поле «другое», без фото', () => {
    renderReview({ view: 'form', code: CODE, project: 'Northwind Bakery' });

    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((node) =>
      normalize(node.textContent ?? ''),
    );
    const documentHeading = (start: string) =>
      headings.filter((text) => text.startsWith(start) && RU_STRINGS.has(text)).length > 0;

    expect(
      FIELD_IDS.filter((id) => !byTestId(id)),
      'поля без разметки',
    ).toEqual([]);
    expect(
      { consent: documentHeading('Согласие'), license: documentHeading('Разрешение') },
      `заголовки документов среди ${JSON.stringify(headings)}`,
    ).toEqual({ consent: true, license: true });
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-testid*="photo"]')).toHaveLength(0);
  });

  it('H3: неизвестный, просроченный и отозванный код рисуют побайтно одну и ту же страницу «ссылка недействительна»', () => {
    const records: (ReviewStateRecord | null)[] = [
      null,
      { status: 'invited', sentAt: at(-61 * DAY_MS), expiresAt: at(-DAY_MS) },
      { status: 'withdrawn', sentAt: at(-DAY_MS), expiresAt: at(DAY_MS) },
    ];
    const markup = records.map((record) =>
      renderToStaticMarkup(
        withIntl(
          <KineticReview
            view={reviewView(record, NOW)}
            code={CODE}
          />,
        ),
      ),
    );

    expect(markup[0]).toContain('data-testid="review-invalid"');
    expect(markup[1]).toBe(markup[0]);
    expect(markup[2]).toBe(markup[0]);
  });

  it('H4: без любой из двух отметок форма не уходит; с обеими — один POST /api/review и вид «отзыв получен»', async () => {
    const fetchMock = respondWith(200, { ok: true });

    vi.stubGlobal('fetch', fetchMock);
    renderReview({ view: 'form', code: CODE, project: 'Northwind Bakery' });
    fillForm();
    toggle('review-no-transfer');

    toggle('review-consent');

    expect((byTestId('review-submit') as HTMLButtonElement).disabled, 'только согласие ПД').toBe(true);
    trySubmit();

    toggle('review-consent');
    toggle('review-license');

    expect((byTestId('review-submit') as HTMLButtonElement).disabled, 'только разрешение').toBe(true);
    trySubmit();

    expect(fetchMock).not.toHaveBeenCalled();

    toggle('review-consent');

    expect((byTestId('review-submit') as HTMLButtonElement).disabled, 'обе отметки').toBe(false);
    fireEvent.click(byTestId('review-submit') as HTMLElement);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe('/api/review');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toMatchObject({
      code: CODE,
      locale: 'ru',
      fullName: FILLED['review-full-name'],
      signature: FILLED['review-signature'],
      occupation: FILLED['review-occupation'],
      link: FILLED['review-link'],
      answers: {
        before: FILLED['review-answer-before'],
        process: FILLED['review-answer-process'],
        after: FILLED['review-answer-after'],
      },
      consent: true,
      license: true,
      restrictions: { noTransfer: true, noLink: false, other: FILLED['review-other'] },
    });
    await screen.findByTestId('review-received');

    expect(presentViews()).toEqual(['review-received']);
  });

  it('H5: ошибка поля видна у поля — aria-invalid и сообщение рядом, форма остается', async () => {
    vi.stubGlobal('fetch', respondWith(400, { ok: false, reason: 'fields' }));
    renderReview({ view: 'form', code: CODE, project: 'Northwind Bakery' });
    fillForm(['review-occupation']);

    const occupation = byTestId('review-occupation') as HTMLElement;

    fireEvent.focus(occupation);
    fireEvent.blur(occupation);
    toggle('review-consent');
    toggle('review-license');
    fireEvent.click(byTestId('review-submit') as HTMLElement);

    await waitFor(() => expect(occupation.getAttribute('aria-invalid')).toBe('true'));

    const messagesNear = (occupation.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => normalize(document.getElementById(id)?.textContent ?? ''));

    expect(messagesNear.filter(Boolean), 'сообщение у поля через aria-describedby').not.toEqual([]);
    expect(presentViews()).toEqual(['review-form']);
  });
});

describe('проверка ссылки в форме', () => {
  it('H7: ссылка не http(s) — ошибка у поля ссылки, запрос не уходит', async () => {
    const fetchMock = respondWith(200, { ok: true });

    vi.stubGlobal('fetch', fetchMock);
    renderReview({ view: 'form', code: CODE, project: 'Northwind Bakery' });
    fillForm(['review-link']);

    const link = byTestId('review-link') as HTMLElement;

    fireEvent.change(link, { target: { value: 'javascript:alert(1)' } });
    toggle('review-consent');
    toggle('review-license');
    fireEvent.click(byTestId('review-submit') as HTMLElement);

    await waitFor(() => expect(link.getAttribute('aria-invalid')).toBe('true'));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(presentViews()).toEqual(['review-form']);
  });
});

describe('секция отзыва в реестре направлений', () => {
  it('H6: в SECTION_NAMES есть review', () => {
    expect(SECTION_NAMES).toContain('review');
  });

  it.each(DESIGN_SECTIONS)('H6: %s отдает для review форму Kinetic', (_design, Section) => {
    const props = { section: 'review', view: 'form', code: 'x', project: 'P' } as unknown as SectionProps;

    expect((Section(props) as ReactElement).type).toBe(KineticReview);
  });
});
