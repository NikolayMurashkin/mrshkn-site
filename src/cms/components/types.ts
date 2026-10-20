import type { ChannelReportTableRow } from '../../lib/crm/types';

/** Ответ обработчика приглашения: срок ссылки при успехе, причина при отказе. */
export type ReviewInviteResponse = { ok: true; expiresAt: string } | { ok: false; reason?: string };

export type ChannelReportTableProps = { rows: ChannelReportTableRow[]; total: ChannelReportTableRow };

export type ReportRowProps = { row: ChannelReportTableRow; label: string };
