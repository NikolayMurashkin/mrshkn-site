import { DefaultTemplate } from '@payloadcms/next/templates';
import { Button, Gutter } from '@payloadcms/ui';
import { redirect } from 'next/navigation';
import type { AdminViewServerProps } from 'payload';
import { formatAdminURL } from 'payload/shared';
import { formatChannelRow, parsePeriod } from '../../lib/crm/report';
import type { ChannelRow } from '../../lib/crm/types';
import { getChannelReport } from '../channel-report';
import { ChannelReportTable } from './ChannelReportTable';
import { CHANNEL_REPORT_PATH, CHANNEL_REPORT_TEXT } from './consts';
import './ChannelReport.scss';

const firstOf = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const toTableRow = (row: ChannelRow) => ({ ...formatChannelRow(row), overKpi: row.overKpi });

/**
 * Свой экран админки: отчет по каналам за период из адреса, по умолчанию — текущий месяц по Москве. Payload своим
 * видам вход не проверяет, поэтому без входа экран сам уводит на вход и возвращает сюда после него.
 */
export const ChannelReportView = async ({ initPageResult, params, searchParams }: AdminViewServerProps) => {
  const { req, locale, permissions, visibleEntities } = initPageResult;
  const { payload, user } = req;
  const adminRoute = payload.config.routes.admin;

  if (!user) {
    const login = formatAdminURL({ adminRoute, path: payload.config.admin.routes.login });
    const back = formatAdminURL({ adminRoute, path: CHANNEL_REPORT_PATH });

    redirect(`${login}?${new URLSearchParams({ redirect: back })}`);
  }

  const period = parsePeriod({ from: firstOf(searchParams?.from), to: firstOf(searchParams?.to) }, new Date());
  const { rows, total } = await getChannelReport({ payload, user, period });

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={user}
      visibleEntities={{ collections: [...visibleEntities.collections], globals: [...visibleEntities.globals] }}
    >
      <Gutter className="channel-report">
        <h1 className="channel-report__title">{CHANNEL_REPORT_TEXT.title}</h1>
        <form
          className="channel-report__period"
          method="get"
        >
          <label className="channel-report__field">
            {CHANNEL_REPORT_TEXT.from}
            <input
              className="channel-report__input"
              type="date"
              name="from"
              defaultValue={period.from}
              autoComplete="off"
              required
            />
          </label>
          <label className="channel-report__field">
            {CHANNEL_REPORT_TEXT.to}
            <input
              className="channel-report__input"
              type="date"
              name="to"
              defaultValue={period.to}
              autoComplete="off"
              required
            />
          </label>
          <Button
            className="channel-report__submit"
            type="submit"
            buttonStyle="primary"
            size="medium"
          >
            {CHANNEL_REPORT_TEXT.submit}
          </Button>
        </form>
        <p className="channel-report__hint">{CHANNEL_REPORT_TEXT.period}</p>
        <ChannelReportTable
          rows={rows.map(toTableRow)}
          total={toTableRow(total)}
        />
      </Gutter>
    </DefaultTemplate>
  );
};
