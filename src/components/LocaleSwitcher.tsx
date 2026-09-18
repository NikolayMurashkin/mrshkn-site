'use client';

import { useLocale } from 'next-intl';
import { LOCALES } from '@/i18n/consts';
import { usePathname } from '@/i18n/navigation';

type LocaleSwitcherProps = {
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
};

export const LocaleSwitcher = ({ className, itemClassName, activeItemClassName }: LocaleSwitcherProps) => {
  const pathname = usePathname();
  const activeLocale = useLocale();

  return (
    <div className={className}>
      {LOCALES.map((locale) => (
        <a
          key={locale}
          href={`/${locale}${pathname === '/' ? '' : pathname}`}
          data-testid={`locale-${locale}`}
          className={locale === activeLocale ? activeItemClassName : itemClassName}
        >
          {locale.toUpperCase()}
        </a>
      ))}
    </div>
  );
};
