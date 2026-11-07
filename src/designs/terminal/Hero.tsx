import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Terms } from '@/components/Term';
import { TERMINAL_LOG_LINES } from './consts';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import styles from './Hero.module.scss';
import { TerminalTermScope } from './TermScope';

export const TerminalHero = () => {
  const t = useTranslations('hero');

  return (
    <section className={styles.hero}>
      <TerminalTermScope>
        <div
          className={styles.gridBackground}
          aria-hidden="true"
        />
        <div className={styles.content}>
          <p
            className={styles.prompt}
            translate="no"
          >
            <span className={styles.promptSign}>$</span>{' '}
            <span
              className={styles.command}
              style={{ '--chars': t('terminal.prompt').length } as CSSProperties}
            >
              <Terms text={t('terminal.prompt')} />
            </span>
          </p>
          <h1 className={styles.title}>
            {t.rich('terminal.title', {
              br: () => <br />,
              accent: (chunks) => <span className={styles.accent}>{chunks}</span>,
            })}
          </h1>
          <p className={styles.lead}>
            <Terms text={t('subtitle')} /> <Terms text={t('terminal.lead')} />
          </p>
          <div className={styles.actions}>
            <Link
              className={`${styles.button} ${styles.buttonPrimary}`}
              href={BRIEF_HREF}
            >
              {t('terminal.primaryCta')}
            </Link>
            <a
              className={styles.button}
              href="#process"
            >
              {t('terminal.secondaryCta')}
            </a>
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelBar}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.panelTitle}>
              <Terms text={t('terminal.logTitle')} />
            </span>
          </div>
          <div className={styles.log}>
            {TERMINAL_LOG_LINES.map((line, index) => (
              <div
                key={line.key}
                className={styles.line}
              >
                <span
                  className={styles.num}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                {line.day && (
                  <span className={styles.time}>
                    <Terms text={t('terminal.day', { day: line.day })} />
                  </span>
                )}
                <span className={styles.text}>
                  {t.rich(`terminal.log.${line.key}`, {
                    k: (chunks) => <span className={styles.key}>{chunks}</span>,
                  })}
                </span>
                <span className={styles.leader} />
                <span className={line.status === 'ok' ? styles.ok : styles.active}>
                  <Terms text={t(`terminal.status.${line.status}`)} />
                </span>
                {line.status === 'active' && <span className={styles.cursor} />}
              </div>
            ))}
          </div>
        </div>
      </TerminalTermScope>
    </section>
  );
};
