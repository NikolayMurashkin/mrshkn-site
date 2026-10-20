// @vitest-environment jsdom
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChannelReportTable } from '@/cms/components/ChannelReportTable';

/**
 * Экран отчета по каналам только выводит готовые строки: таблица с заголовками столбцов, строка на канал, строка
 * «Итого», превышение KPI цены квалифицированной заявки — отметкой на ячейке. Разметка разбирается в DOM, чтобы
 * проверять текст ячеек, а не форму HTML.
 */

const HEADERS = [
  'Канал',
  'Заявки',
  'Квалифицированные',
  'Договоры',
  'Выручка',
  'Расход',
  'CPL',
  'Цена квалифицированной',
  'Окупаемость',
];

const COST_PER_QUALIFIED = HEADERS.indexOf('Цена квалифицированной');

const EMPTY_TEXT = 'За период нет заявок и расходов';

const nb = (text: string) => text.replaceAll(' ', ' ');

const YANDEX = {
  source: 'yandex',
  leads: '3',
  qualified: '2',
  contracts: '1',
  revenue: nb('100 000 ₽'),
  spend: nb('9 000 ₽'),
  cpl: nb('3 000 ₽'),
  costPerQualified: nb('4 500 ₽'),
  payback: nb('1 111 %'),
  overKpi: true,
};

const UNMARKED = {
  source: 'без метки',
  leads: '2',
  qualified: '1',
  contracts: '0',
  revenue: nb('0 ₽'),
  spend: nb('0 ₽'),
  cpl: '—',
  costPerQualified: '—',
  payback: '—',
  overKpi: false,
};

const TOTAL = {
  source: 'без метки',
  leads: '5',
  qualified: '3',
  contracts: '1',
  revenue: nb('100 000 ₽'),
  spend: nb('9 000 ₽'),
  cpl: nb('1 800 ₽'),
  costPerQualified: nb('3 000 ₽'),
  payback: nb('1 111 %'),
  overKpi: false,
};

type Row = typeof YANDEX;

const cellsOf = (row: Row) => [
  row.source,
  row.leads,
  row.qualified,
  row.contracts,
  row.revenue,
  row.spend,
  row.cpl,
  row.costPerQualified,
  row.payback,
];

const render = (rows: Row[], total: Row = TOTAL) => {
  const container = document.createElement('div');

  container.innerHTML = renderToString(
    <ChannelReportTable
      rows={rows}
      total={total}
    />,
  );

  return container;
};

const rowsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('tr')).map((row) => Array.from(row.querySelectorAll('th, td')));

const textsOf = (container: HTMLElement) =>
  rowsOf(container).map((cells) => cells.map((cell) => cell.textContent?.trim() ?? ''));

const rowBySource = (container: HTMLElement, source: string) =>
  rowsOf(container).find((cells) => cells[0]?.textContent?.trim() === source);

describe('таблица отчета по каналам', () => {
  it('T1: две строки и итог — таблица с заголовками столбцов, значениями строк и строкой «Итого»', () => {
    const container = render([YANDEX, UNMARKED]);
    const texts = textsOf(container);

    expect(container.querySelector('table')).not.toBeNull();
    expect(texts).toContainEqual(HEADERS);
    expect(texts).toContainEqual(cellsOf(YANDEX));
    expect(texts).toContainEqual(cellsOf(UNMARKED));
    expect(texts).toContainEqual(['Итого', ...cellsOf(TOTAL).slice(1)]);
  });

  it('T2: превышение KPI — отметка data-over-kpi на ячейке цены квалифицированной, без превышения — нет', () => {
    const container = render([YANDEX, { ...UNMARKED, costPerQualified: nb('2 000 ₽') }]);

    expect(rowBySource(container, 'yandex')?.[COST_PER_QUALIFIED]?.hasAttribute('data-over-kpi')).toBe(true);
    expect(rowBySource(container, 'без метки')?.[COST_PER_QUALIFIED]?.hasAttribute('data-over-kpi')).toBe(false);
  });

  it('T3: «без метки» и «—» выводятся как есть', () => {
    const texts = textsOf(render([UNMARKED]));

    expect(texts).toContainEqual(['без метки', '2', '1', '0', nb('0 ₽'), nb('0 ₽'), '—', '—', '—']);
  });

  it('T4: строк нет — текст «За период нет заявок и расходов», таблицы нет', () => {
    const container = render([], {
      ...UNMARKED,
      leads: '0',
      qualified: '0',
    });

    expect(container.textContent).toContain(EMPTY_TEXT);
    expect(container.querySelector('table')).toBeNull();
  });

  it('T5: таблица лежит в своем блоке прокрутки channel-report__scroll', () => {
    const container = render([YANDEX]);

    expect(container.querySelector('.channel-report__scroll table')).not.toBeNull();
  });
});
