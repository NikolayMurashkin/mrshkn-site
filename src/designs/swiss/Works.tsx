import { useTranslations } from 'next-intl';
import { CaseImage } from '@/components/CaseImage';
import { caseHref, WORK_PAGE_PATH } from '@/content/work';
import { Link } from '@/i18n/navigation';
import { DESIGN_LABELS } from '../consts';
import type { WorksProps } from '../types';
import { worksView } from '../works';
import { SWISS_CARD_METRICS_LIMIT, SWISS_CASE_CARD_SIZES } from './consts';
import { ArrowRightIcon, ArrowUpRightIcon } from './icons';
import styles from './Works.module.scss';

export const SwissWorks = ({ cases, variant = 'home' }: WorksProps) => {
  const t = useTranslations('work');
  const niches = useTranslations('brief.niches');
  const { shown, hasMore } = worksView(cases, variant);
  const Heading = variant === 'page' ? 'h1' : 'h2';

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
      <div className={styles.head}>
        <div className={styles.aside}>
          <span
            className={styles.index}
            aria-hidden="true"
          />
          <span className={styles.mark}>{t('mark')}</span>
        </div>
        <div className={styles.titleColumn}>
          <Heading
            className={styles.heading}
            id="work-heading"
          >
            {t('heading')}
          </Heading>
          <p className={styles.note}>{t('note')}</p>
        </div>
      </div>
      <ul className={styles.list}>
        {shown.map((item) => (
          <li
            className={styles.card}
            data-testid="case-card"
            key={item.slug}
          >
            <span className={styles.coverFrame}>
              <CaseImage
                className={styles.cover}
                image={item.cover}
                sizes={SWISS_CASE_CARD_SIZES}
              />
            </span>
            <div className={styles.body}>
              <span className={item.kind === 'client' ? `${styles.tag} ${styles.tagSolid}` : styles.tag}>
                {t(`kind.${item.kind}`)}
              </span>
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
                  {item.metrics.slice(0, SWISS_CARD_METRICS_LIMIT).map((metric, index) => (
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
          <ArrowRightIcon />
        </Link>
      ) : null}
    </section>
  );
};
