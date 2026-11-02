// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DESIGN_NAMES, SECTION_NAMES } from '@/designs/consts';
import { EditorialSection } from '@/designs/editorial';
import { KineticSection } from '@/designs/kinetic';
import { PopSection } from '@/designs/pop';
import { SwissSection } from '@/designs/swiss';
import { TerminalSection } from '@/designs/terminal';
import type { DesignName, SectionProps } from '@/designs/types';
import { normalizeSiteUrl } from '@/lib/audit/url';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

/**
 * Секция «Проверьте свой сайт» — своя верстка в каждом из пяти направлений, логика формы общая: ссылка на тест Google
 * с адресом посетителя, согласие на обработку ПД, проверка адреса до отправки, ответ сервера — «заявка у нас» или ошибка
 * с сохраненной формой. Секция стоит на главной и на странице отраслевого тарифа, на других тарифах ее нет.
 */

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/ru',
  useParams: () => ({ locale: 'ru' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

type Locale = 'ru' | 'en';

type Messages = typeof ru;

const MESSAGES: Record<Locale, Messages> = { ru, en: en as Messages };

const SECTIONS: Record<DesignName, (props: SectionProps) => ReactNode> = {
  kinetic: KineticSection,
  terminal: TerminalSection,
  pop: PopSection,
  swiss: SwissSection,
  editorial: EditorialSection,
};

const AUDIT_SECTION = 'audit';

const FILLED = { name: 'Анна', url: 'example.ru', contact: '@anna' };

const PSI_FOR_FILLED = 'https://pagespeed.web.dev/report?url=https%3A%2F%2Fexample.ru%2F&form_factor=mobile';

const PSI_HOME = 'https://pagespeed.web.dev/';

const DESIGNS = [...DESIGN_NAMES];

const ROWS = DESIGNS.flatMap((design) => (['ru', 'en'] as const).map((locale) => [design, locale] as const));

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

const withIntl = (locale: Locale, node: ReactNode) => (
  <NextIntlClientProvider
    locale={locale}
    timeZone="Europe/Moscow"
    messages={MESSAGES[locale]}
  >
    {node}
  </NextIntlClientProvider>
);

const sectionNode = (design: DesignName, props: SectionProps) => SECTIONS[design](props);

const auditProps = { section: AUDIT_SECTION } as unknown as SectionProps;

/** Без секции в реестре направление нечего рисовать: сначала — что секция заведена, потом — ее поведение. */
const expectAuditRegistered = () => {
  expect(SECTION_NAMES as readonly string[], 'секция audit в SECTION_NAMES').toContain(AUDIT_SECTION);
};

const renderAudit = (design: DesignName) => {
  expectAuditRegistered();

  return render(withIntl('ru', sectionNode(design, auditProps)));
};

const markupOf = (design: DesignName, locale: Locale, props: SectionProps) =>
  renderToStaticMarkup(withIntl(locale, sectionNode(design, props)));

const servicePage = (service: string) => ({ section: 'servicePage', service }) as unknown as SectionProps;

const byTestId = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.querySelector<T>(`[data-testid="${id}"]`);

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Строка ru.json по пути: ожидаемый текст берется из сообщений, а не переписывается в тест. */
const ruText = (path: string) => {
  const value = path
    .split('.')
    .reduce<unknown>(
      (node, key) => (node !== null && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined),
      ru,
    );

  expect(typeof value, `${path} в ru.json`).toBe('string');

  return normalize(value as string);
};

const change = (id: string, value: string) => {
  const field = byTestId(id);

  expect(field, `поле ${id}`).not.toBeNull();
  fireEvent.change(field as HTMLElement, { target: { value } });
};

const fillForm = (overrides: Partial<typeof FILLED> = {}) => {
  const values = { ...FILLED, ...overrides };

  change('audit-name', values.name);
  change('audit-url', values.url);
  change('audit-contact', values.contact);
};

const checkConsent = () => {
  const consent = byTestId('audit-consent');

  expect(consent, 'отметка согласия').not.toBeNull();
  fireEvent.click(consent as HTMLElement);
};

const submitButton = () => {
  const button = byTestId<HTMLButtonElement>('audit-submit');

  expect(button, 'кнопка отправки').not.toBeNull();

  return button as HTMLButtonElement;
};

/** Попытка отправить и кнопкой, и событием submit формы: неверный адрес не должен уйти ни так, ни так. */
const trySubmit = () => {
  const button = submitButton();

  fireEvent.click(button);

  const form = button.closest('form');

  if (form) {
    fireEvent.submit(form);
  }
};

const respondWith = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

const psiHref = () => {
  const link = byTestId<HTMLAnchorElement>('audit-psi');

  expect(link, 'ссылка «Проверить самому»').not.toBeNull();

  return link as HTMLAnchorElement;
};

const valueOf = (id: string) => byTestId<HTMLInputElement>(id)?.value;

beforeEach(() => {
  window.matchMedia = mockMatchMedia() as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('форма «Проверьте свой сайт» в каждом направлении', () => {
  it.each(DESIGNS)('S1 %s: адрес в форме → ссылка на тест Google с этим адресом, в новой вкладке', (design) => {
    renderAudit(design);
    change('audit-url', FILLED.url);

    const link = psiHref();

    expect(link.getAttribute('href')).toBe(PSI_FOR_FILLED);
    expect(link.getAttribute('target')).toBe('_blank');
    expect((link.getAttribute('rel') ?? '').split(/\s+/)).toContain('noopener');
  });

  it.each(DESIGNS)('S2 %s: поле адреса пустое → ссылка на главную PageSpeed Insights', (design) => {
    renderAudit(design);

    expect(psiHref().getAttribute('href')).toBe(PSI_HOME);
  });

  it.each(DESIGNS)('S3 %s: все поля заполнены, согласие не отмечено → кнопка недоступна', (design) => {
    renderAudit(design);
    fillForm();

    expect(submitButton().disabled).toBe(true);
  });

  it.each(DESIGNS)('S3 %s: согласие не отмечено, событие submit формы → запрос не уходит', async (design) => {
    const fetchMock = respondWith(200, { ok: true });

    vi.stubGlobal('fetch', fetchMock);
    renderAudit(design);
    fillForm();

    const form = submitButton().closest('form');

    expect(form, 'форма секции').not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(DESIGNS)('S4 %s: адрес ftp → сообщение об адресе, запрос не уходит', async (design) => {
    const fetchMock = respondWith(200, { ok: true });

    vi.stubGlobal('fetch', fetchMock);
    renderAudit(design);
    fillForm({ url: 'ftp://x.ru' });

    const url = byTestId('audit-url') as HTMLElement;

    fireEvent.focus(url);
    fireEvent.blur(url);
    checkConsent();
    trySubmit();

    const expected = ruText('audit.urlError');

    await waitFor(() => expect(normalize(document.body.textContent ?? '')).toContain(expected));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(DESIGNS)('S5 %s: все верно, ответ 200 → POST /api/audit с полями формы и «заявка у нас»', async (design) => {
    const fetchMock = respondWith(200, { ok: true });

    vi.stubGlobal('fetch', fetchMock);
    renderAudit(design);
    fillForm();
    checkConsent();
    fireEvent.click(submitButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;

    expect(url).toBe('/api/audit');
    expect(init.method).toBe('POST');
    expect(body).toMatchObject({ name: FILLED.name, contact: FILLED.contact, consent: true });
    expect([FILLED.url, normalizeSiteUrl(FILLED.url)], 'адрес в теле — как введен или нормализованный').toContain(
      body.url,
    );

    const expected = ruText('audit.success.title');

    await waitFor(() => expect(byTestId('audit-success'), 'блок «заявка у нас»').not.toBeNull());
    expect(normalize(byTestId('audit-success')?.textContent ?? '')).toContain(expected);
  });

  it.each(DESIGNS)('S6 %s: ответ 502 → ошибка отправки, введенные данные на месте', async (design) => {
    vi.stubGlobal('fetch', respondWith(502, { ok: false, reason: 'delivery' }));
    renderAudit(design);
    fillForm();
    checkConsent();
    fireEvent.click(submitButton());

    const expected = ruText('audit.error');

    await waitFor(() => expect(byTestId('audit-error'), 'блок ошибки').not.toBeNull());
    expect(normalize(byTestId('audit-error')?.textContent ?? '')).toContain(expected);
    expect({
      name: valueOf('audit-name'),
      url: valueOf('audit-url'),
      contact: valueOf('audit-contact'),
    }).toEqual(FILLED);
  });
});

describe('секция «Проверьте свой сайт» на страницах', () => {
  it.each(DESIGNS)('P1 %s: секция audit заведена в реестре и есть в таблице компонентов направления', (design) => {
    expectAuditRegistered();
    expect(markupOf(design, 'ru', auditProps)).toContain('id="audit"');
  });

  it.each(ROWS)('P2 %s, %s: на странице отраслевого тарифа есть секция с полем адреса', (design, locale) => {
    const html = markupOf(design, locale, servicePage('industry'));

    expect(html).toContain('id="audit"');
    expect(html).toContain('data-testid="audit-url"');
  });

  it.each(DESIGNS)('P3 %s: на странице тарифа «лендинг» секции нет', (design) => {
    const html = markupOf(design, 'ru', servicePage('landing'));

    expect(html).toContain('data-service="landing"');
    expect(html).not.toContain('id="audit"');
  });
});
