import { LEGAL_BULLET_ITEM, LEGAL_HEADING, LEGAL_ORDERED_ITEM, LEGAL_STRONG, LEGAL_TITLE } from './consts';
import type { LegalBlock, LegalInline, LegalSection } from './types';

/** Строка с `**…**` → куски текста, жирные отмечены; пустых кусков нет. */
export const parseLegalInline = (line: string): LegalInline[] => {
  const pieces: LegalInline[] = [];
  let last = 0;

  for (const match of line.matchAll(LEGAL_STRONG)) {
    if (match.index > last) {
      pieces.push({ text: line.slice(last, match.index), strong: false });
    }

    pieces.push({ text: match[1], strong: true });
    last = match.index + match[0].length;
  }

  if (last < line.length) {
    pieces.push({ text: line.slice(last), strong: false });
  }

  return pieces;
};

/**
 * Текст документа короткого юрпакета → блоки страницы. Понимает только то, что есть в документах: `# ` — заголовок
 * документа, `## ` — раздела, строки `N. ` подряд — нумерованный список, `- ` подряд — маркированный, `**…**` —
 * жирное; пустая строка закрывает абзац и список. Все остальное — текст абзаца как есть.
 */
export const parseLegalDocument = (source: string): LegalBlock[] => {
  const blocks: LegalBlock[] = [];
  let current: LegalBlock | null = null;

  const close = () => {
    if (current) {
      blocks.push(current);
      current = null;
    }
  };

  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const title = LEGAL_TITLE.exec(line);
    const heading = LEGAL_HEADING.exec(line);
    const ordered = LEGAL_ORDERED_ITEM.exec(line);
    const bullet = LEGAL_BULLET_ITEM.exec(line);
    const open: LegalBlock | null = current;

    if (line.trim() === '') {
      close();
    } else if (title) {
      close();
      blocks.push({ type: 'title', text: title[1] });
    } else if (heading) {
      close();
      blocks.push({ type: 'heading', text: heading[1] });
    } else if (ordered) {
      if (open?.type === 'list' && open.ordered) {
        open.items.push(parseLegalInline(ordered[2]));
      } else {
        close();
        current = { type: 'list', ordered: true, start: Number(ordered[1]), items: [parseLegalInline(ordered[2])] };
      }
    } else if (bullet) {
      if (open?.type === 'list' && !open.ordered) {
        open.items.push(parseLegalInline(bullet[1]));
      } else {
        close();
        current = { type: 'list', ordered: false, items: [parseLegalInline(bullet[1])] };
      }
    } else if (open?.type === 'paragraph') {
      open.content.push(...parseLegalInline(` ${line}`));
    } else {
      close();
      current = { type: 'paragraph', content: parseLegalInline(line) };
    }
  }

  close();

  return blocks;
};

/** Блоки → разделы по заголовкам `## `; то, что до первого заголовка, — раздел без заголовка. */
export const groupLegalSections = (blocks: LegalBlock[]): LegalSection[] => {
  const sections: LegalSection[] = [];

  for (const block of blocks) {
    if (block.type === 'heading') {
      sections.push({ heading: block.text, blocks: [] });
    } else if (block.type !== 'title') {
      if (sections.length === 0) {
        sections.push({ heading: null, blocks: [] });
      }

      sections[sections.length - 1].blocks.push(block);
    }
  }

  return sections;
};
