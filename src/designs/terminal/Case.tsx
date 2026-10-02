import { useLocale, useTranslations } from 'next-intl';
import { CaseImage } from '@/components/CaseImage';
import { CASE_COVER_SIZES, CASE_SHOT_SIZES } from '@/components/consts';
import { splitParagraphs } from '@/content/work';
import { DESIGN_LABELS } from '../consts';
import type { CaseProps } from '../types';
import styles from './Case.module.scss';

export const TerminalCase = ({ caseItem }: CaseProps) => {
  const t = useTranslations('work');
  const niches = useTranslations('brief.niches');
  const locale = useLocale();
  const { title, kind, niche, design, demoUrl, cover, task, solution, metrics, lighthouse } = caseItem;
  const texts = [
    { id: 'task', paragraphs: splitParagraphs(task) },
    { id: 'solution', paragraphs: splitParagraphs(solution) },
  ].filter(({ paragraphs }) => paragraphs.length > 0);

  return (
    <article
      className={styles.case}
      data-testid="case"
    >
      <a
        className={styles.back}
        href={`/${locale}#work`}
      >
        ← {t('back')}
      </a>

      <header className={styles.head}>
        <span className={styles.kind}>{t(`kind.${kind}`)}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.meta}>
          {niches(niche)} · {t('design', { design: DESIGN_LABELS[design] })}
        </p>
        {demoUrl ? (
          <a
            className={styles.demo}
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('demoLink')}
          </a>
        ) : null}
      </header>

      <CaseImage
        className={styles.cover}
        image={cover}
        sizes={CASE_COVER_SIZES}
        priority
      />

      {texts.map(({ id, paragraphs }) => (
        <section
          className={styles.block}
          data-testid={`case-${id}`}
          aria-labelledby={`case-${id}-heading`}
          key={id}
        >
          <h2
            className={styles.heading}
            id={`case-${id}-heading`}
          >
            {t(id)}
          </h2>
          <div className={styles.text}>
            {paragraphs.map((paragraph, index) => (
              <p
                className={styles.paragraph}
                key={index}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      ))}

      {metrics.length > 0 ? (
        <section
          className={styles.block}
          data-testid="case-results"
          aria-labelledby="case-results-heading"
        >
          <h2
            className={styles.heading}
            id="case-results-heading"
          >
            {t('results')}
          </h2>
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
        </section>
      ) : null}

      {lighthouse ? (
        <section
          className={styles.block}
          data-testid="case-lighthouse"
          aria-labelledby="case-lighthouse-heading"
        >
          <h2
            className={styles.heading}
            id="case-lighthouse-heading"
          >
            {t('lighthouse')}
          </h2>
          <CaseImage
            className={styles.shot}
            image={lighthouse}
            sizes={CASE_SHOT_SIZES}
          />
        </section>
      ) : null}
    </article>
  );
};
