import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import type { ReviewProps } from '@/components/Review/types';
import { useReview } from '@/components/Review/use-review';
import { REVIEW_ANSWERS, REVIEW_CONSENT_VERSION } from '@/lib/review/consts';
import type { ReviewDocumentText } from '@/lib/review/types';
import { ArrowRightIcon } from './icons';
import { KineticReviewDocument } from './KineticReviewDocument';
import { KineticReviewField } from './KineticReviewField';
import { KineticReviewNotice } from './KineticReviewNotice';
import { KINETIC_REVIEW_CLASS as cls } from './consts';

const KineticReviewStyles = dynamic(() => import('./KineticReviewStyles').then((module) => module.KineticReviewStyles));

export const KineticReview = ({ view: initialView, code, project }: ReviewProps) => {
  const t = useTranslations('review');
  const review = useReview({ view: initialView, code });
  const { view, checks, status, canSend, toggle, submit } = review;

  if (view !== 'form') {
    return (
      <>
        <KineticReviewStyles />
        <KineticReviewNotice view={view} />
      </>
    );
  }

  const edition = t('documents.edition', { version: REVIEW_CONSENT_VERSION });
  const more = t('documents.more');
  const checksMissing = !checks.consent || !checks.license;

  return (
    <main className={cls.page}>
      <KineticReviewStyles />
      <header className={cls.head}>
        <p className={cls.kicker}>{t('kicker')}</p>
        <h1 className={cls.title}>{t('title')}</h1>
        <p className={cls.lead}>{t('lead', { project: project ?? '' })}</p>
      </header>

      <form
        className={cls.form}
        data-testid="review-form"
        noValidate
        onSubmit={submit}
      >
        <section
          className={cls.group}
          aria-labelledby="review-author"
        >
          <h2
            className={cls.groupTitle}
            id="review-author"
          >
            {t('groups.author.title')}
          </h2>
          <p className={cls.note}>{t('groups.author.note')}</p>
          <div className={cls.fields}>
            <KineticReviewField
              name="fullName"
              label={t('fields.fullName')}
              autoComplete="name"
              review={review}
            />
            <KineticReviewField
              name="signature"
              label={t('fields.signature')}
              hint={t('fields.signatureHint')}
              review={review}
            />
            <KineticReviewField
              name="occupation"
              label={t('fields.occupation')}
              autoComplete="organization-title"
              review={review}
            />
            <KineticReviewField
              name="link"
              label={t('fields.link')}
              type="url"
              autoComplete="url"
              review={review}
            />
          </div>
        </section>

        <section
          className={cls.group}
          aria-labelledby="review-answers"
        >
          <h2
            className={cls.groupTitle}
            id="review-answers"
          >
            {t('groups.answers.title')}
          </h2>
          <p className={cls.note}>{t('groups.answers.note')}</p>
          <div className={cls.fields}>
            {REVIEW_ANSWERS.map((answer) => (
              <KineticReviewField
                key={answer}
                name={answer}
                label={t(`fields.${answer}`)}
                multiline
                review={review}
              />
            ))}
          </div>
        </section>

        <section
          className={cls.group}
          aria-labelledby="review-documents"
        >
          <h2
            className={cls.groupTitle}
            id="review-documents"
          >
            {t('groups.documents.title')}
          </h2>
          <p className={cls.note}>{t('groups.documents.note')}</p>
          <KineticReviewDocument
            id="consent"
            text={t.raw('documents.consent') as ReviewDocumentText}
            edition={edition}
            more={more}
            checked={checks.consent}
            onToggle={toggle}
          >
            <fieldset className={cls.restrictions}>
              <legend className={cls.legend}>{t('restrictions.title')}</legend>
              <p className={cls.hint}>{t('restrictions.note')}</p>
              <label className={cls.check}>
                <input
                  type="checkbox"
                  data-testid="review-no-transfer"
                  name="noTransfer"
                  checked={checks.noTransfer}
                  onChange={toggle('noTransfer')}
                />
                <span>{t('restrictions.noTransfer')}</span>
              </label>
              <label className={cls.check}>
                <input
                  type="checkbox"
                  data-testid="review-no-link"
                  name="noLink"
                  checked={checks.noLink}
                  onChange={toggle('noLink')}
                />
                <span>{t('restrictions.noLink')}</span>
              </label>
              <KineticReviewField
                name="other"
                label={t('restrictions.other')}
                review={review}
              />
            </fieldset>
          </KineticReviewDocument>
          <KineticReviewDocument
            id="license"
            text={t.raw('documents.license') as ReviewDocumentText}
            edition={edition}
            more={more}
            checked={checks.license}
            onToggle={toggle}
          />
        </section>

        <div className={cls.actions}>
          <button
            type="submit"
            className={cls.button}
            data-testid="review-submit"
            disabled={!canSend}
            aria-describedby={checksMissing ? 'review-checks-note' : undefined}
          >
            {status === 'sending' ? t('sending') : t('submit')}
            <ArrowRightIcon />
          </button>
          {checksMissing ? (
            <p
              className={cls.hint}
              id="review-checks-note"
            >
              {t('checksNote')}
            </p>
          ) : null}
        </div>

        {status === 'fields' || status === 'error' ? (
          <p
            className={cls.error}
            role="alert"
          >
            {status === 'fields' ? t('fieldsError') : t('error')}
          </p>
        ) : null}
      </form>
    </main>
  );
};
