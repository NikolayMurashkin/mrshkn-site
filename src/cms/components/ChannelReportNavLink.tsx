'use client';

import { Link, NavGroup, useConfig } from '@payloadcms/ui';
import { usePathname } from 'next/navigation';
import { formatAdminURL } from 'payload/shared';
import { CHANNEL_REPORT_PATH, CHANNEL_REPORT_TEXT } from './consts';

/** Пункт «Отчет по каналам» в меню админки — той же разметкой, что пункты коллекций, с отметкой открытой страницы. */
export const ChannelReportNavLink = () => {
  const pathname = usePathname();
  const { config } = useConfig();
  const href = formatAdminURL({ adminRoute: config.routes.admin, path: CHANNEL_REPORT_PATH });
  const isActive = pathname === href;

  const label = (
    <>
      {isActive && <div className="nav__link-indicator" />}
      <span className="nav__link-label">{CHANNEL_REPORT_TEXT.title}</span>
    </>
  );

  return (
    <NavGroup label={CHANNEL_REPORT_TEXT.navGroup}>
      {isActive ? (
        <div className="nav__link">{label}</div>
      ) : (
        <Link
          className="nav__link"
          href={href}
          prefetch={false}
        >
          {label}
        </Link>
      )}
    </NavGroup>
  );
};
