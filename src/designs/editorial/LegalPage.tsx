import { LegalDocument, legalDocumentClasses } from '@/components/LegalDocument';
import type { LegalPageProps } from '@/lib/legal/types';
import styles from './PrivacyPage.module.scss';

const CLASSES = legalDocumentClasses(styles);

export const EditorialLegalPage = ({ kicker, title, blocks, history }: LegalPageProps) => (
  <article className={styles.page}>
    <header className={styles.head}>
      <div className={styles.headAside}>
        <p className={styles.kicker}>{kicker}</p>
      </div>
      <div className={styles.headMain}>
        <h1 className={styles.title}>{title}</h1>
      </div>
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
