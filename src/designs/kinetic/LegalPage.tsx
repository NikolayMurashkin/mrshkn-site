import { LegalDocument, legalDocumentClasses } from '@/components/LegalDocument';
import type { LegalPageProps } from '@/lib/legal/types';
import styles from './PrivacyPage.module.scss';

const CLASSES = legalDocumentClasses(styles);

export const KineticLegalPage = ({ kicker, title, blocks, history }: LegalPageProps) => (
  <article className={styles.page}>
    <header className={styles.head}>
      <p className={styles.kicker}>{kicker}</p>
      <h1 className={styles.title}>{title}</h1>
    </header>

    <div className={styles.cols}>
      <LegalDocument
        blocks={blocks}
        history={history}
        classes={CLASSES}
      />
    </div>
  </article>
);
