import { useTranslations } from 'next-intl';
import { Terms } from '@/components/Term';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import styles from './Hero.module.scss';
import { EditorialTermScope } from './TermScope';

export const EditorialHero = () => {
  const t = useTranslations('hero');

  return (
    <section className={styles.hero}>
      <EditorialTermScope>
        <div className={styles.main}>
          <h1 className={styles.title}>{t('editorial.title')}</h1>
          <p className={styles.lead}>
            <Terms text={t('subtitle')} /> <Terms text={t('editorial.lead')} />
          </p>
          <div className={styles.actions}>
            <Link
              className={`${styles.button} ${styles.primary}`}
              href={BRIEF_HREF}
            >
              {t('editorial.primaryCta')}
            </Link>
            <a
              className={styles.button}
              href="#process"
            >
              {t('editorial.secondaryCta')}
            </a>
          </div>
        </div>
        <aside className={styles.aside}>
          <span className={styles.kicker}>
            <Terms text={t('editorial.quoteKicker')} />
          </span>
          <blockquote className={styles.quote}>
            <Terms text={t('editorial.quote')} />
          </blockquote>
          <ul className={styles.refs}>
            <li>
              <Terms text={t('editorial.refDeadline')} />
            </li>
            <li>
              <Terms text={t('editorial.refQuality')} />
            </li>
            <li>
              <Terms text={t('editorial.refWarranty')} />
            </li>
          </ul>
        </aside>
      </EditorialTermScope>
    </section>
  );
};
