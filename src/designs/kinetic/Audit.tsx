import { useTranslations } from 'next-intl';
import { AUDIT_FIELD_NAMES, AUDIT_HINT_FIELDS } from '@/components/Audit/consts';
import type { AuditFieldName } from '@/components/Audit/types';
import { useAudit } from '@/components/Audit/use-audit';
import { Terms } from '@/components/Term';
import { Link } from '@/i18n/navigation';
import { HONEYPOT_FIELD } from '@/lib/brief/consts';
import { PRIVACY_HREF } from '@/lib/consts';
import { buttonClass } from './button';
import { ArrowRightIcon, ArrowUpRightIcon } from './icons';
import { SectionHead } from './SectionHead';
import brief from './KineticBrief.module.scss';
import styles from './Audit.module.scss';
import { KineticTermScope } from './TermScope';

export const KineticAudit = () => {
  const t = useTranslations('audit');
  const quiz = useTranslations('brief');
  const {
    hydrated,
    status,
    consent,
    trap,
    canSend,
    psiHref,
    input,
    errorOf,
    errorId,
    hintId,
    setConsent,
    setTrap,
    submit,
    successRef,
  } = useAudit();

  const fieldError = (field: AuditFieldName) => {
    const error = errorOf(field);

    return error ? (
      <span
        className={brief.fieldError}
        id={errorId(field)}
      >
        <Terms text={t(error === 'url' ? 'urlError' : 'fieldError')} />
      </span>
    ) : null;
  };

  return (
    <section
      className={styles.audit}
      id="audit"
      aria-labelledby="audit-heading"
    >
      <KineticTermScope>
        <SectionHead
          id="audit-heading"
          title={t('title')}
        />

        <div className={styles.body}>
          <div className={styles.texts}>
            <p className={styles.lead}>
              <Terms text={t('lead')} />
            </p>
            <p>
              <Terms text={t('why')} />
            </p>
            <p>
              <Terms text={t('text')} />
            </p>
          </div>

          <div className={styles.side}>
            {status === 'sent' ? (
              <div
                ref={successRef}
                className={styles.success}
                data-testid="audit-success"
                tabIndex={-1}
              >
                <h3 className={styles.successTitle}>{t('success.title')}</h3>
                <p>
                  <Terms text={t('success.text')} />
                </p>
              </div>
            ) : (
              <form
                className={styles.form}
                noValidate
                onSubmit={submit}
              >
                {AUDIT_FIELD_NAMES.map((field) => {
                  const props = input(field);

                  return (
                    <div
                      key={field}
                      className={brief.field}
                    >
                      <label
                        className={brief.label}
                        htmlFor={props.id}
                      >
                        {t(field)}
                      </label>
                      <input
                        className={brief.input}
                        placeholder={field === 'url' ? t('urlPlaceholder') : undefined}
                        {...props}
                      />
                      {AUDIT_HINT_FIELDS.includes(field) ? (
                        <span
                          className={styles.hint}
                          id={hintId(field)}
                        >
                          <Terms text={t(`${field}Hint`)} />
                        </span>
                      ) : null}
                      {fieldError(field)}
                    </div>
                  );
                })}
                <label
                  className={brief.trap}
                  aria-hidden="true"
                >
                  {quiz('honeypot')}
                  <input
                    name={HONEYPOT_FIELD}
                    tabIndex={-1}
                    autoComplete="off"
                    value={trap}
                    onChange={setTrap}
                  />
                </label>
                <label className={brief.consent}>
                  <input
                    type="checkbox"
                    data-testid="audit-consent"
                    checked={consent}
                    disabled={!hydrated}
                    onChange={setConsent}
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
                {status === 'error' ? (
                  <p
                    className={brief.error}
                    data-testid="audit-error"
                    role="alert"
                  >
                    <Terms text={t('error')} />
                  </p>
                ) : null}
                <button
                  type="submit"
                  className={`${buttonClass({ primary: true })} ${styles.submit}`}
                  data-testid="audit-submit"
                  disabled={!canSend}
                >
                  {status === 'sending' ? quiz('sending') : t('submit')}
                  <ArrowRightIcon />
                </button>
              </form>
            )}

            <div className={styles.self}>
              <a
                className={styles.psi}
                href={psiHref}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="audit-psi"
              >
                {t('self')}
                <ArrowUpRightIcon />
              </a>
              <p className={styles.note}>
                <Terms text={t('selfNote')} />
              </p>
            </div>

            <p className={styles.promise}>
              <Terms text={t('promise')} />
            </p>

            <div className={styles.studios}>
              <p>
                <Terms text={t('studios')} />
              </p>
              <p className={styles.footnote}>
                <Terms text={t('studiosNote')} />
              </p>
            </div>
          </div>
        </div>
      </KineticTermScope>
    </section>
  );
};
