import { usePrivacyPolicy } from '@/components/PrivacyPolicy/use-privacy-policy';
import styles from './PrivacyPage.module.scss';

export const TerminalPrivacyPage = () => {
  const { kicker, title, updated, tocLabel, changeChoice, sections, reopen } = usePrivacyPolicy();

  return (
    <article className={styles.page}>
      <header className={styles.head}>
        <p className={styles.label}>{kicker}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.meta}>{updated}</p>
      </header>

      <div className={styles.cols}>
        <div className={styles.legal}>
          {sections.map((section) => (
            <section
              key={section.id}
              className={styles.section}
              aria-labelledby={section.anchor}
            >
              <h2
                className={styles.heading}
                id={section.anchor}
              >
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className={styles.paragraph}
                >
                  {paragraph}
                </p>
              ))}
              {section.items.length > 0 ? (
                <ul className={styles.list}>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.choice ? (
                <button
                  type="button"
                  className={styles.choice}
                  onClick={reopen}
                >
                  {changeChoice}
                </button>
              ) : null}
            </section>
          ))}
        </div>

        <nav
          className={styles.aside}
          aria-label={tocLabel}
        >
          <ol className={styles.toc}>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.anchor}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </article>
  );
};
