import { useTranslations } from 'next-intl';
import { CaseImage } from '@/components/CaseImage';
import { CARD_METRICS_LIMIT, caseHref, WORK_PAGE_PATH } from '@/content/work';
import { Link } from '@/i18n/navigation';
import { DESIGN_LABELS } from '../consts';
import type { WorksProps } from '../types';
import { worksView } from '../works';
import { ArrowRightIcon, ArrowUpRightIcon } from './icons';
import { EditorialRubric } from './Rubric';
import { coverSizes, worksLayout } from './utils';
import styles from './Works.module.scss';

export const EditorialWorks = ({ cases, variant = 'home' }: WorksProps) => {
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
        <EditorialRubric
          label={t('mark')}
          note={t('note')}
        />
        <Heading
          className={styles.title}
          id="work-heading"
        >
          {t('heading')}
        </Heading>
      </div>
      <ul
        className={styles.list}
        data-layout={worksLayout(shown.length)}
      >
        {shown.map((item, index) => (
          <li
            className={styles.card}
            data-testid="case-card"
            key={item.slug}
          >
            <figure className={styles.figure}>
              <CaseImage
                className={styles.cover}
                image={item.cover}
                sizes={coverSizes(index)}
              />
              {item.coverCaption ? <figcaption className={styles.caption}>{item.coverCaption}</figcaption> : null}
            </figure>
            <div className={styles.body}>
              <span className={styles.kind}>{t(`kind.${item.kind}`)}</span>
              <h3 className={styles.cardTitle}>
                <Link
                  className={styles.link}
                  href={caseHref(item.slug)}
                >
                  {item.title}
                </Link>
              </h3>
              <span className={styles.meta}>
                {niches(item.niche)}
                {item.design ? (
                  <>
                    {' · '}
                    <span translate="no">{t('design', { design: DESIGN_LABELS[item.design] })}</span>
                  </>
                ) : null}
              </span>
              {item.metrics.length > 0 ? (
                <ul className={styles.metrics}>
                  {item.metrics.slice(0, CARD_METRICS_LIMIT).map((metric, metricIndex) => (
                    <li
                      className={styles.metric}
                      data-testid="case-metric"
                      key={metricIndex}
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
