import { QUALIFIED_LEAD_KPI_RUB } from '../../lib/crm/consts';
import { formatRub } from '../../lib/crm/report';
import { CHANNEL_REPORT_COLUMNS, CHANNEL_REPORT_SOURCE_LABEL, CHANNEL_REPORT_TEXT } from './consts';
import type { ChannelReportTableProps, ReportRowProps } from './types';
import './ChannelReport.scss';

const ReportRow = ({ row, label }: ReportRowProps) => (
  <tr>
    <th
      className="channel-report__source"
      scope="row"
    >
      {label}
    </th>
    {CHANNEL_REPORT_COLUMNS.map(({ key }) => (
      <td
        key={key}
        className="channel-report__number"
        data-over-kpi={key === 'costPerQualified' && row.overKpi ? '' : undefined}
      >
        {row[key]}
      </td>
    ))}
  </tr>
);

/** Таблица отчета по каналам: выводит готовые строки как есть, своей логики счета у нее нет. */
export const ChannelReportTable = ({ rows, total }: ChannelReportTableProps) => {
  if (rows.length === 0) {
    return <p className="channel-report__empty">{CHANNEL_REPORT_TEXT.empty}</p>;
  }

  return (
    <>
      <div
        className="channel-report__scroll"
        role="region"
        aria-label={CHANNEL_REPORT_TEXT.title}
        tabIndex={0}
      >
        <table className="channel-report__table">
          <thead>
            <tr>
              <th scope="col">{CHANNEL_REPORT_SOURCE_LABEL}</th>
              {CHANNEL_REPORT_COLUMNS.map(({ key, label }) => (
                <th
                  key={key}
                  className="channel-report__number"
                  scope="col"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <ReportRow
                key={row.source}
                row={row}
                label={row.source}
              />
            ))}
          </tbody>
          <tfoot>
            <ReportRow
              row={total}
              label={CHANNEL_REPORT_TEXT.total}
            />
          </tfoot>
        </table>
      </div>
      <p className="channel-report__note">{CHANNEL_REPORT_TEXT.overKpi(formatRub(QUALIFIED_LEAD_KPI_RUB))}</p>
    </>
  );
};
