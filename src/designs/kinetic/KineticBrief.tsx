import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BRIEF_STEP_REQUIRED } from '@/components/Brief/consts';
import type { BriefProps } from '@/components/Brief/types';
import { useBrief } from '@/components/Brief/use-brief';
import { useStepFocus } from '@/components/Brief/use-step-focus';
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
import { buttonClass } from './button';
import { ArrowRightIcon } from './icons';
import { KineticChoices } from './KineticChoices';
import { KineticDesignChoice } from './KineticDesignChoice';
import styles from './KineticBrief.module.scss';

export const KineticBrief = ({ design, plan, niche }: BriefProps) => {
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
  } = useBrief({ design, plan, niche });
  const [touched, setTouched] = useState<readonly string[]>([]);
  const stepTitle = useStepFocus(step);

  const touch = (field: string) => () => setTouched((fields) => (fields.includes(field) ? fields : [...fields, field]));

  const invalid = (field: 'name' | 'contact') =>
    BRIEF_STEP_REQUIRED[current].includes(field) && touched.includes(field) && !answers[field].trim();

  return (
    <main className={styles.quiz}>
      <div className={styles.head}>
        <span
          className={styles.count}
          aria-hidden="true"
        >
          {String(step + 1).padStart(2, '0')}
          <small>/{String(BRIEF_STEPS.length).padStart(2, '0')}</small>
        </span>
        <p className={styles.kicker}>{t('step', { current: step + 1, total: BRIEF_STEPS.length })}</p>
        <h1 className={styles.title}>{t('title')}</h1>
      </div>

      <ol
        className={styles.progress}
        aria-hidden="true"
      >
        {Array.from({ length: BRIEF_STEPS.length }, (_, index) => (
          <li
            key={index}
            data-done={index <= step}
          />
        ))}
      </ol>

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
          <KineticChoices
            field="product"
            values={BRIEF_STEP_VALUES.product}
            selected={answers.product}
            labelOf={(value) => (value === 'other' ? t('products.other') : plans(`${value}.name`))}
            onPick={pick}
          />
        ) : null}

        {current === 'niche' ? (
          <KineticChoices
            field="niche"
            values={BRIEF_STEP_VALUES.niche}
            selected={answers.niche}
            labelOf={(value) => t(`niches.${value}`)}
            onPick={pick}
          />
        ) : null}

        {current === 'design' ? (
          <KineticDesignChoice
            selected={answers.design}
            onPick={pick}
            labelOf={(value) => t(`designs.${value}`)}
          />
        ) : null}

        {current === 'scope' ? (
          <div className={styles.groups}>
            <div className={styles.group}>
              <p className={styles.groupLabel}>{t('steps.scope.timing')}</p>
              <KineticChoices
                field="timing"
                values={BRIEF_STEP_VALUES.timing}
                selected={answers.timing}
                labelOf={(value) => t(`timings.${value}`)}
                onPick={pick}
              />
            </div>
            <div className={styles.group}>
              <p className={styles.groupLabel}>{t('steps.scope.budget')}</p>
              <KineticChoices
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
            className={buttonClass()}
            data-testid="brief-back"
            onClick={back}
          >
            {t('back')}
          </button>
        ) : null}

        {isLast ? (
          <button
            type="button"
            className={`${buttonClass({ primary: true })} ${styles.forward}`}
            data-testid="brief-submit"
            disabled={!filled || !consent || status === 'sending'}
            onClick={send}
          >
            {status === 'sending' ? t('sending') : t('submit')}
            <ArrowRightIcon />
          </button>
        ) : (
          <button
            type="button"
            className={`${buttonClass({ primary: true })} ${styles.forward}`}
            data-testid="brief-next"
            disabled={!filled}
            onClick={next}
          >
            {t('next')}
            <ArrowRightIcon />
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
