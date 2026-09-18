'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import styles from './SiteControls.module.scss';

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('controls');

  return (
    <button
      type="button"
      className={styles.toggle}
      data-testid="theme-toggle"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      {t('theme')}
    </button>
  );
};
