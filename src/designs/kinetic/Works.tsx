import { useTranslations } from 'next-intl';
import { CaseImage } from '@/components/CaseImage';
import { CASE_CARD_SIZES } from '@/components/consts';
import { CARD_METRICS_LIMIT, caseHref, WORK_PAGE_PATH } from '@/content/work';
import { Link } from '@/i18n/navigation';
import { DESIGN_LABELS } from '../consts';
import type { WorksProps } from '../types';
import { worksView } from '../works';
import { ArrowUpRightIcon } from './icons';
import { SectionHead } from './SectionHead';
import styles from './Works.module.scss';

export const KineticWorks = ({ cases, variant = 'home' }: WorksProps) => {
  const t = useTranslations('work');
  const niches = useTranslations('brief.niches');
  const { shown, hasMore } = worksView(cases, variant);

  if (cases.length === 0) {
    return null;
  }

  return (
    <section
      className={variant === 'page' ? `${styles.works} ${styles.page}` : styles.works}
      data-testid="works"
      id="work"
      aria-labelledby="work-heading"
    >
      <SectionHead
        id="work-heading"
        kicker={t('kineticKicker')}
        title={t('heading')}
        note={t('note')}
        level={variant === 'page' ? 'h1' : 'h2'}
      />
      <ul className={styles.list}>
        {shown.map((item) => (
          <li
            className={styles.card}
            data-testid="case-card"
            key={item.slug}
          >
            <span className={styles.cover}>
              <CaseImage
                className={styles.image}
                image={item.cover}
                sizes={CASE_CARD_SIZES}
              />
            </span>
            <div className={styles.body}>
              <span className={styles.kind}>{t(`kind.${item.kind}`)}</span>
              <h3 className={styles.title}>
                <Link
                  className={styles.link}
                  href={caseHref(item.slug)}
                >
                  {item.title}
                </Link>
              </h3>
              <span className={styles.meta}>
                {niches(item.niche)}
                {item.design ? ` · ${t('design', { design: DESIGN_LABELS[item.design] })}` : null}
              </span>
              {item.metrics.length > 0 ? (
                <ul className={styles.metrics}>
                  {item.metrics.slice(0, CARD_METRICS_LIMIT).map((metric, index) => (
                    <li
                      className={styles.metric}
                      data-testid="case-metric"
                      key={index}
                    >
                      <span className={styles.metricValue}>{metric.value}</span>
                      <span className={styles.metricLabel}>{metric.label}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.demoUrl ? (
                <a
                  className={styles.demo}
                  href={item.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('demoLink')}
                  <ArrowUpRightIcon />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <Link
          className={styles.all}
          href={WORK_PAGE_PATH}
        >
          {t('allLink')}
        </Link>
      ) : null}
    </section>
  );
};
