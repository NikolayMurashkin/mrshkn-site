'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { LOCALES } from '@/i18n/consts';
import { usePathname } from '@/i18n/navigation';

type LocaleSwitcherProps = {
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
};

/**
 * Ссылки языков ведут на ту же страницу с тем же запросом (`?plan=`, `?niche=`): выбор тарифа и ниши не теряется.
 * Вне роутера (рендер секции в строку) запроса нет.
 */
export const LocaleSwitcher = ({ className, itemClassName, activeItemClassName }: LocaleSwitcherProps) => {
  const pathname = usePathname();
  const query = useSearchParams()?.toString() ?? '';
  const activeLocale = useLocale();
  const search = query ? `?${query}` : '';

  return (
    <div className={className}>
      {LOCALES.map((locale) => (
        <a
          key={locale}
          href={`/${locale}${pathname === '/' ? '' : pathname}${search}`}
          data-testid={`locale-${locale}`}
          aria-current={locale === activeLocale ? 'true' : undefined}
          className={locale === activeLocale ? activeItemClassName : itemClassName}
        >
          {locale.toUpperCase()}
        </a>
      ))}
    </div>
  );
};
