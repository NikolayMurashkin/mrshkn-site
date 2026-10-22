import { useTranslations } from 'next-intl';
import { CaseImage } from '@/components/CaseImage';
import { CASE_COVER_SIZES, CASE_SHOT_SIZES } from '@/components/consts';
import { splitParagraphs, WORK_PAGE_PATH } from '@/content/work';
import { Link } from '@/i18n/navigation';
import { DESIGN_LABELS } from '../consts';
import type { CaseProps } from '../types';
import { ArrowLeftIcon, ArrowUpRightIcon } from './icons';
import styles from './Case.module.scss';

export const EditorialCase = ({ caseItem }: CaseProps) => {
  const t = useTranslations('work');
  const niches = useTranslations('brief.niches');
  const {
    title,
    kind,
    niche,
    design,
    demoUrl,
    appUrl,
    cover,
    coverCaption,
    task,
    solution,
    stack,
    metrics,
    lighthouse,
  } = caseItem;
  const texts = [
    { id: 'task', paragraphs: splitParagraphs(task) },
    { id: 'solution', paragraphs: splitParagraphs(solution) },
  ].filter(({ paragraphs }) => paragraphs.length > 0);

  return (
    <article
      className={styles.case}
      data-testid="case"
    >
      <Link
        className={styles.back}
        href={WORK_PAGE_PATH}
      >
        <ArrowLeftIcon />
        {t('back')}
      </Link>

      <header className={styles.head}>
        <div className={styles.margin}>
          <span className={styles.kind}>{t(`kind.${kind}`)}</span>
          <span className={styles.meta}>
            {niches(niche)}
            {design ? (
              <>
                {' · '}
                <span translate="no">{t('design', { design: DESIGN_LABELS[design] })}</span>
              </>
            ) : null}
          </span>
        </div>
        <div className={styles.headMain}>
          <h1 className={styles.title}>{title}</h1>
          {demoUrl || appUrl ? (
            <div className={styles.links}>
              {demoUrl ? (
                <a
                  className={styles.demo}
                  href={demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('demoLink')}
                  <ArrowUpRightIcon />
                </a>
              ) : null}
              {appUrl ? (
                <a
                  className={styles.demo}
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('appLink')}
                  <ArrowUpRightIcon />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <figure className={styles.figure}>
        <CaseImage
          className={styles.cover}
          image={cover}
          sizes={CASE_COVER_SIZES}
          priority
        />
        {coverCaption ? <figcaption className={styles.caption}>{coverCaption}</figcaption> : null}
      </figure>

      {texts.map(({ id, paragraphs }, textIndex) => (
        <section
          className={styles.block}
          data-testid={`case-${id}`}
          aria-labelledby={`case-${id}-heading`}
          key={id}
        >
          <div className={styles.margin}>
            <h2
              className={styles.heading}
              id={`case-${id}-heading`}
            >
              {t(id)}
            </h2>
          </div>
          <div className={styles.main}>
            <div className={styles.prose}>
              {paragraphs.map((paragraph, index) => (
                <p
                  className={textIndex === 0 && index === 0 ? styles.first : undefined}
                  key={index}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      ))}

      {stack.length > 0 ? (
        <section
          className={styles.block}
          data-testid="case-stack"
          aria-labelledby="case-stack-heading"
        >
          <div className={styles.margin}>
            <h2
              className={styles.heading}
              id="case-stack-heading"
            >
              {t('stack')}
            </h2>
          </div>
          <div className={styles.main}>
            <ul className={styles.stack}>
              {stack.map((item, index) => (
                <li
                  className={styles.stackItem}
                  key={index}
                  translate="no"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {metrics.length > 0 ? (
        <section
          className={`${styles.block} ${styles.wide}`}
          data-testid="case-results"
          aria-labelledby="case-results-heading"
        >
          <div className={styles.margin}>
            <h2
              className={styles.heading}
              id="case-results-heading"
            >
              {t('results')}
            </h2>
          </div>
          <div className={styles.main}>
            <ul className={styles.metrics}>
              {metrics.map((metric, index) => (
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
          </div>
        </section>
      ) : null}

      {lighthouse ? (
        <section
          className={`${styles.block} ${styles.wide}`}
          data-testid="case-lighthouse"
          aria-labelledby="case-lighthouse-heading"
        >
          <div className={styles.margin}>
            <h2
              className={styles.heading}
              id="case-lighthouse-heading"
            >
              {t('lighthouse')}
            </h2>
          </div>
          <div className={styles.main}>
            <CaseImage
              className={styles.shot}
              image={lighthouse}
              sizes={CASE_SHOT_SIZES}
            />
          </div>
        </section>
      ) : null}
    </article>
  );
};
