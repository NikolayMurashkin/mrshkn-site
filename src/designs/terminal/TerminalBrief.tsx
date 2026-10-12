import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { BRIEF_STEP_REQUIRED } from '@/components/Brief/consts';
import type { BriefProps } from '@/components/Brief/types';
import { useBrief } from '@/components/Brief/use-brief';
import { Link } from '@/i18n/navigation';
import {
  BRIEF_STEPS,
  BRIEF_STEP_VALUES,
  COMMENT_MAX_LENGTH,
  CONTACT_MAX_LENGTH,
  HONEYPOT_FIELD,
  NAME_MAX_LENGTH,
} from '@/lib/brief/consts';
import { PRIVACY_HREF } from '@/lib/consts';
import { TerminalChoices } from './TerminalChoices';
import { TerminalDesignChoice } from './TerminalDesignChoice';
import styles from './TerminalBrief.module.scss';

export const TerminalBrief = ({ design, plan }: BriefProps) => {
  const t = useTranslations('brief');
  const plans = useTranslations('pricing.plans');
  const {
    step,
    current,
    isLast,
    filled,
    answers,
    consent,
    trap,
    status,
    pick,
    write,
    back,
    next,
    send,
    setConsent,
    setTrap,
  } = useBrief({ design, plan });
  const [touched, setTouched] = useState<readonly string[]>([]);
  const stepTitle = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);

  useEffect(() => {
    if (shownStep.current === step) {
      return;
    }

    shownStep.current = step;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    stepTitle.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    stepTitle.current?.focus({ preventScroll: true });
  }, [step]);

  const touch = (field: string) => () => setTouched((fields) => (fields.includes(field) ? fields : [...fields, field]));

  const invalid = (field: 'name' | 'contact') =>
    BRIEF_STEP_REQUIRED[current].includes(field) && touched.includes(field) && !answers[field].trim();

  return (
    <main className={styles.quiz}>
      <div className={styles.head}>
        <p className={styles.kicker}>{t('step', { current: step + 1, total: BRIEF_STEPS.length })}</p>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('lead')}</p>
      </div>

      <div
        className={styles.progress}
        aria-hidden="true"
      >
        <ol className={styles.cells}>
          {Array.from({ length: BRIEF_STEPS.length }, (_, index) => (
            <li
              key={index}
              data-done={index <= step}
            />
          ))}
        </ol>
        <span className={styles.count}>
          {String(step + 1).padStart(2, '0')}/{String(BRIEF_STEPS.length).padStart(2, '0')}
        </span>
      </div>

      <section
        className={styles.step}
        data-testid="brief-step"
        data-step={current}
      >
        <h2
          ref={stepTitle}
          className={styles.stepTitle}
          tabIndex={-1}
        >
          {t(`steps.${current}.title`)}
        </h2>
        <p className={styles.note}>{t(`steps.${current}.note`)}</p>

        {current === 'product' ? (
          <TerminalChoices
            field="product"
            values={BRIEF_STEP_VALUES.product}
            selected={answers.product}
            labelOf={(value) => (value === 'other' ? t('products.other') : plans(`${value}.name`))}
            onPick={pick}
          />
        ) : null}

        {current === 'niche' ? (
          <TerminalChoices
            field="niche"
            values={BRIEF_STEP_VALUES.niche}
            selected={answers.niche}
            labelOf={(value) => t(`niches.${value}`)}
            onPick={pick}
          />
        ) : null}

        {current === 'design' ? (
          <TerminalDesignChoice
            selected={answers.design}
            onPick={pick}
            labelOf={(value) => t(`designs.${value}`)}
          />
        ) : null}

        {current === 'scope' ? (
          <div className={styles.groups}>
            <div className={styles.group}>
              <p className={styles.groupLabel}>{t('steps.scope.timing')}</p>
              <TerminalChoices
                field="timing"
                values={BRIEF_STEP_VALUES.timing}
                selected={answers.timing}
                labelOf={(value) => t(`timings.${value}`)}
                onPick={pick}
              />
            </div>
            <div className={styles.group}>
              <p className={styles.groupLabel}>{t('steps.scope.budget')}</p>
              <TerminalChoices
                field="budget"
                values={BRIEF_STEP_VALUES.budget}
                selected={answers.budget}
                labelOf={(value) => t(`budgets.${value}`)}
                onPick={pick}
              />
            </div>
          </div>
        ) : null}

        {current === 'contacts' ? (
          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.label}>{t('steps.contacts.name')}</span>
              <input
                className={styles.input}
                data-testid="brief-name"
                name="name"
                autoComplete="name"
                maxLength={NAME_MAX_LENGTH}
                value={answers.name}
                aria-invalid={invalid('name')}
                aria-describedby={invalid('name') ? 'brief-name-error' : undefined}
                onChange={write('name')}
                onBlur={touch('name')}
              />
              {invalid('name') ? (
                <span
                  className={styles.fieldError}
                  id="brief-name-error"
                >
                  {t('fieldError')}
                </span>
              ) : null}
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t('steps.contacts.contact')}</span>
              <input
                className={styles.input}
                data-testid="brief-contact"
                name="contact"
                autoComplete="off"
                spellCheck={false}
                maxLength={CONTACT_MAX_LENGTH}
                value={answers.contact}
                aria-invalid={invalid('contact')}
                aria-describedby={invalid('contact') ? 'brief-contact-error' : undefined}
                onChange={write('contact')}
                onBlur={touch('contact')}
              />
              {invalid('contact') ? (
                <span
                  className={styles.fieldError}
                  id="brief-contact-error"
                >
                  {t('fieldError')}
                </span>
              ) : null}
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t('steps.contacts.comment')}</span>
              <textarea
                className={styles.textarea}
                data-testid="brief-comment"
                name="comment"
                autoComplete="off"
                maxLength={COMMENT_MAX_LENGTH}
                rows={4}
                value={answers.comment}
                onChange={write('comment')}
              />
            </label>
            <label
              className={styles.trap}
              aria-hidden="true"
            >
              {t('honeypot')}
              <input
                name={HONEYPOT_FIELD}
                tabIndex={-1}
                autoComplete="off"
                value={trap}
                onChange={(event) => setTrap(event.target.value)}
              />
            </label>
            <label className={styles.consent}>
              <input
                type="checkbox"
                data-testid="brief-consent"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>
                {t.rich('consent', {
                  policy: (chunks) => (
                    <Link
                      href={PRIVACY_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            </label>
          </div>
        ) : null}
      </section>

      <div className={styles.actions}>
        {step > 0 ? (
          <button
            type="button"
            className={`${styles.button} ${styles.quiet}`}
            data-testid="brief-back"
            onClick={back}
          >
            {t('back')}
          </button>
        ) : null}

        {isLast ? (
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            data-testid="brief-submit"
            disabled={!filled || !consent || status === 'sending'}
            onClick={send}
          >
            {status === 'sending' ? t('sending') : t('submit')}
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.button} ${styles.primary} ${styles.next}`}
            data-testid="brief-next"
            disabled={!filled}
            onClick={next}
          >
            {t('next')}
          </button>
        )}
      </div>

      {status === 'error' ? (
        <p
          className={styles.error}
          data-testid="brief-error"
          role="alert"
        >
          {t('error')}
        </p>
      ) : null}
    </main>
  );
};
