import { usePrivacyPolicy } from '@/components/PrivacyPolicy/use-privacy-policy';
import { useActiveSection } from '../use-active-section';
import { EDITORIAL_NAV_OFFSET } from './consts';
import styles from './PrivacyPage.module.scss';

export const EditorialPrivacyPage = () => {
  const { kicker, title, updated, tocLabel, changeChoice, sections, anchors, reopen } = usePrivacyPolicy();
  const active = useActiveSection(anchors, true, EDITORIAL_NAV_OFFSET);

  return (
    <article className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headAside}>
          <p className={styles.kicker}>{kicker}</p>
        </div>
        <div className={styles.headMain}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.meta}>{updated}</p>
        </div>
      </header>

      <div className={styles.cols}>
        <nav
          className={styles.aside}
          aria-label={tocLabel}
        >
          <ol className={styles.toc}>
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.anchor}`}
                  aria-current={active === section.anchor ? 'true' : undefined}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

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
      </div>
    </article>
  );
};
