import { Fragment } from 'react';
import { LEGAL_HISTORY_ANCHOR, LEGAL_SECTION_ANCHOR } from '@/lib/legal/consts';
import { groupLegalSections } from '@/lib/legal/parse';
import type { LegalSection } from '@/lib/legal/types';
import type { LegalDocumentClasses, LegalDocumentProps, LegalInlineTextProps } from './types';

/** Классы документа из CSS-модуля страницы политики направления: имена у всех пяти одни и те же. */
export const legalDocumentClasses = (styles: Readonly<Record<string, string>>): LegalDocumentClasses => ({
  legal: `${styles.legal} ${styles.document}`,
  section: styles.section,
  heading: styles.heading,
  paragraph: styles.paragraph,
  list: styles.list,
  numbered: `${styles.list} ${styles.numbered}`,
});

const LegalInlineText = ({ content }: LegalInlineTextProps) =>
  content.map((piece, index) =>
    piece.strong ? <strong key={index}>{piece.text}</strong> : <Fragment key={index}>{piece.text}</Fragment>,
  );

const renderBlock = (block: LegalSection['blocks'][number], index: number, classes: LegalDocumentClasses) => {
  if (block.type === 'paragraph') {
    return (
      <p
        key={index}
        className={classes.paragraph}
      >
        <LegalInlineText content={block.content} />
      </p>
    );
  }

  const items = block.items.map((item, itemIndex) => (
    <li key={itemIndex}>
      <LegalInlineText content={item} />
    </li>
  ));

  return block.ordered ? (
    <ol
      key={index}
      className={classes.numbered}
      start={block.start}
    >
      {items}
    </ol>
  ) : (
    <ul
      key={index}
      className={classes.list}
    >
      {items}
    </ul>
  );
};

/**
 * Текст документа юрпакета в верстке страницы политики направления: разделы по заголовкам, абзацы, списки, жирное.
 * Под текстом — прошлые редакции, если документ их ведет. Номера разделов — из текста документа, не счетчиком.
 * У заголовка раздела якорь `section-<N>` по порядку разделов с заголовком — ссылка на раздел; у прошлых редакций — `history`.
 */
export const LegalDocument = ({ blocks, history, classes }: LegalDocumentProps) => {
  const sections = groupLegalSections(blocks);
  const headed = sections.filter((section) => section.heading !== null);

  return (
    <div className={classes.legal}>
      {sections.map((section, sectionIndex) => (
        <section
          key={section.heading ?? sectionIndex}
          className={classes.section}
        >
          {section.heading ? (
            <h2
              className={classes.heading}
              id={`${LEGAL_SECTION_ANCHOR}${headed.indexOf(section) + 1}`}
            >
              {section.heading}
            </h2>
          ) : null}
          {section.blocks.map((block, index) => renderBlock(block, index, classes))}
        </section>
      ))}
      {history ? (
        <section className={classes.section}>
          <h2
            className={classes.heading}
            id={LEGAL_HISTORY_ANCHOR}
          >
            {history.title}
          </h2>
          <p className={classes.paragraph}>{history.text}</p>
        </section>
      ) : null}
    </div>
  );
};
