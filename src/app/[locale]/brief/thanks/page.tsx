import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { THANKS_HREF } from '@/lib/brief/consts';
import styles from './page.module.scss';

type ThanksPageProps = {
  params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }: ThanksPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'briefThanks.meta' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: `/${locale}${THANKS_HREF}` },
    robots: { index: false, follow: true },
  };
};

const ThanksPage = async ({ params }: ThanksPageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'briefThanks' });

  return (
    <main
      className={styles.thanks}
      data-testid="brief-thanks"
    >
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.text}>{t('text')}</p>
      <p className={styles.note}>{t('note')}</p>
      <Link
        className={styles.back}
        href="/"
      >
        {t('back')}
      </Link>
    </main>
  );
};

export default ThanksPage;
