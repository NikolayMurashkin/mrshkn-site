'use client';

import { useTranslations } from 'next-intl';
import { useState, type ChangeEvent } from 'react';
import { useRouter } from '@/i18n/navigation';
import {
  BRIEF_STEPS,
  THANKS_HREF,
  BRIEF_STEP_VALUES,
  COMMENT_MAX_LENGTH,
  CONTACT_MAX_LENGTH,
  HONEYPOT_FIELD,
  NAME_MAX_LENGTH,
} from '@/lib/brief/consts';
import type { BriefChoice } from '@/lib/brief/types';
import { Choices } from './Choices';
import { BRIEF_STEP_REQUIRED } from './consts';
import { DesignChoice } from './DesignChoice';
import type { BriefAnswers, BriefProps } from './types';
import styles from './Brief.module.scss';

const EMPTY: BriefAnswers = {
  product: '',
  niche: '',
  design: '',
  timing: '',
  budget: '',
  name: '',
  contact: '',
  comment: '',
};

export const Brief = ({ design, plan }: BriefProps) => {
  const t = useTranslations('brief');
  const plans = useTranslations('pricing.plans');
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<BriefAnswers>({ ...EMPTY, design, product: plan ?? '' });
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');

  const current = BRIEF_STEPS[step];
  const isLast = step === BRIEF_STEPS.length - 1;
  const filled = BRIEF_STEP_REQUIRED[current].every((field) => answers[field as keyof BriefAnswers].trim());

  const pick = (field: BriefChoice, value: string) => setAnswers((state) => ({ ...state, [field]: value }));

  const write =
    (field: 'name' | 'contact' | 'comment') => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setAnswers((state) => ({ ...state, [field]: event.target.value }));

  const send = async () => {
    setStatus('sending');

    try {
      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...answers, plan, consent, [HONEYPOT_FIELD]: trap }),
      });

      if (!response.ok) {
        setStatus('error');

        return;
      }

      router.push(THANKS_HREF);
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className={styles.brief}>
      <div className={styles.head}>
        <p className={styles.counter}>{t('step', { current: step + 1, total: BRIEF_STEPS.length })}</p>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('lead')}</p>
        <div className={styles.track}>
          <span
            className={styles.trackFill}
            style={{ width: `${((step + 1) / BRIEF_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <section
        className={styles.step}
        data-testid="brief-step"
        data-step={current}
      >
        <h2 className={styles.stepTitle}>{t(`steps.${current}.title`)}</h2>
        <p className={styles.stepNote}>{t(`steps.${current}.note`)}</p>

        {current === 'product' ? (
          <Choices
            field="product"
            values={BRIEF_STEP_VALUES.product}
            selected={answers.product}
            labelOf={(value) => (value === 'other' ? t('products.other') : plans(`${value}.name`))}
            onPick={pick}
          />
        ) : null}

        {current === 'niche' ? (
          <Choices
            field="niche"
            values={BRIEF_STEP_VALUES.niche}
            selected={answers.niche}
            labelOf={(value) => t(`niches.${value}`)}
            onPick={pick}
          />
        ) : null}

        {current === 'design' ? (
          <DesignChoice
            selected={answers.design}
            onPick={pick}
            labelOf={(value) => t(`designs.${value}`)}
          />
        ) : null}

        {current === 'scope' ? (
          <div className={styles.groups}>
            <div className={styles.group}>
              <p className={styles.groupLabel}>{t('steps.scope.timing')}</p>
              <Choices
                field="timing"
                values={BRIEF_STEP_VALUES.timing}
                selected={answers.timing}
                labelOf={(value) => t(`timings.${value}`)}
                onPick={pick}
              />
            </div>
            <div className={styles.group}>
              <p className={styles.groupLabel}>{t('steps.scope.budget')}</p>
              <Choices
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
              <span className={styles.fieldLabel}>{t('steps.contacts.name')}</span>
              <input
                className={styles.input}
                data-testid="brief-name"
                maxLength={NAME_MAX_LENGTH}
                value={answers.name}
                onChange={write('name')}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('steps.contacts.contact')}</span>
              <input
                className={styles.input}
                data-testid="brief-contact"
                maxLength={CONTACT_MAX_LENGTH}
                value={answers.contact}
                onChange={write('contact')}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('steps.contacts.comment')}</span>
              <textarea
                className={styles.textarea}
                data-testid="brief-comment"
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
              <span>{t('consent')}</span>
            </label>
          </div>
        ) : null}
      </section>

      <div className={styles.actions}>
        {step > 0 ? (
          <button
            type="button"
            className={styles.back}
            data-testid="brief-back"
            onClick={() => setStep((value) => value - 1)}
          >
            {t('back')}
          </button>
        ) : null}

        {isLast ? (
          <button
            type="button"
            className={styles.next}
            data-testid="brief-submit"
            disabled={!filled || !consent || status === 'sending'}
            onClick={send}
          >
            {status === 'sending' ? t('sending') : t('submit')}
          </button>
        ) : (
          <button
            type="button"
            className={styles.next}
            data-testid="brief-next"
            disabled={!filled}
            onClick={() => setStep((value) => value + 1)}
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
