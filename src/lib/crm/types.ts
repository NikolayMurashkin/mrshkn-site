import type { LeadStage } from '../brief/types';

/** Период отчета: оба дня включительно, по московскому времени. */
export type ReportPeriod = { from: string; to: string };

/** Параметры периода из адреса: любой может не прийти или прийти не датой. */
export type PeriodQuery = { from?: string | null; to?: string | null };

/** Границы периода моментами ISO: `start` включительно, `end` — нет. */
export type PeriodBounds = { start: string; end: string };

export type ReportLead = {
  createdAt: string;
  utm_source?: string | null;
  stage: LeadStage;
  qualifiedAt?: string | null;
  amount?: number | null;
};

export type ReportExpense = { date: string; utm_source: string; amount: number };

/** Строка отчета по каналу: числа сырые; `source: null` — заявки без метки. */
export type ChannelRow = {
  source: string | null;
  leads: number;
  qualified: number;
  contracts: number;
  revenue: number;
  spend: number;
  cpl: number | null;
  costPerQualified: number | null;
  overKpi: boolean;
  payback: number | null;
};

/** Счетчики и суммы канала, из которых считаются цены и окупаемость. */
export type ChannelTotals = Pick<ChannelRow, 'leads' | 'qualified' | 'contracts' | 'revenue' | 'spend'>;

export type ChannelReport = { rows: ChannelRow[]; total: ChannelRow };

/** Строка отчета для экрана: все значения — готовый текст. */
export type FormattedChannelRow = {
  source: string;
  leads: string;
  qualified: string;
  contracts: string;
  revenue: string;
  spend: string;
  cpl: string;
  costPerQualified: string;
  payback: string;
};

export type ChannelReportTableRow = FormattedChannelRow & { overKpi: boolean };
