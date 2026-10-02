import { useTranslations } from 'next-intl';
import { CaseImage } from '@/components/CaseImage';
import { CASE_CARD_SIZES } from '@/components/consts';
import { CARD_METRICS_LIMIT, caseHref } from '@/content/work';
import { Link } from '@/i18n/navigation';
import { DESIGN_LABELS } from '../consts';
import type { WorksProps } from '../types';
import styles from './Works.module.scss';

export const EditorialWorks = ({ cases }: WorksProps) => {
  const t = useTranslations('work');
  const niches = useTranslations('brief.niches');

  if (cases.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.works}
      data-testid="works"
      id="work"
      aria-labelledby="work-heading"
    >
      <div className={styles.rule}>
        <h2
          className={styles.heading}
          id="work-heading"
        >
          {t('heading')}
        </h2>
        <span className={styles.note}>{t('note')}</span>
      </div>
      <ul className={styles.list}>
        {cases.map((item) => (
          <li
            className={styles.card}
            data-testid="case-card"
            key={item.slug}
          >
            <CaseImage
              className={styles.cover}
              image={item.cover}
              sizes={CASE_CARD_SIZES}
            />
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
                {niches(item.niche)} · {t('design', { design: DESIGN_LABELS[item.design] })}
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
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
