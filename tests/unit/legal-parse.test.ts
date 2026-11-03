import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { groupLegalSections, parseLegalDocument, parseLegalInline } from '@/lib/legal/parse';

/**
 * Разборщик документов юрпакета (`content/legal/*.md` → блоки страницы). Понимает только разметку пакета:
 * `#`, `##`, `N. `, `- `, `**…**`, пустая строка; пункт договора `1.1. ` — абзац.
 */

const plain = (content: { text: string }[]) => content.map((piece) => piece.text).join('');

const read = (file: string) =>
  readFileSync(fileURLToPath(new URL(`../../content/legal/${file}`, import.meta.url)), 'utf8');

describe('parseLegalDocument', () => {
  it('L1: пункт договора «1.1. …» — абзац, номер остается в тексте, списка нет', () => {
    const blocks = parseLegalDocument('1.1. Оферта действует до отзыва.');

    expect(blocks).toEqual([
      { type: 'paragraph', content: [{ text: '1.1. Оферта действует до отзыва.', strong: false }] },
    ]);
  });

  it('L2: две строки подряд — один абзац, склеены одним пробелом', () => {
    const blocks = parseLegalDocument('Первая строка.\nВторая строка.');

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('paragraph');
    expect(plain((blocks[0] as { content: { text: string }[] }).content)).toBe('Первая строка. Вторая строка.');
  });

  it('L3: нумерованный список с «3.» — start 3, пункты по порядку', () => {
    const blocks = parseLegalDocument('3. Третий\n4. Четвертый');

    expect(blocks).toEqual([
      {
        type: 'list',
        ordered: true,
        start: 3,
        items: [[{ text: 'Третий', strong: false }], [{ text: 'Четвертый', strong: false }]],
      },
    ]);
  });

  it('L4: «**жирное** текст» — жирный кусок и обычный', () => {
    expect(parseLegalInline('**Скорость.** Проверяем тестом.')).toEqual([
      { text: 'Скорость.', strong: true },
      { text: ' Проверяем тестом.', strong: false },
    ]);
  });

  it('L5: «## Раздел» — заголовок раздела, «# Документ» — заголовок документа', () => {
    expect(parseLegalDocument('# Документ\n\n## Раздел')).toEqual([
      { type: 'title', text: 'Документ' },
      { type: 'heading', text: 'Раздел' },
    ]);
  });

  it('L6: текст до первого «##» — раздел без заголовка, дальше — разделы по заголовкам', () => {
    const sections = groupLegalSections(parseLegalDocument('# Документ\n\nВводная.\n\n## Первый\n\nТекст.'));

    expect(sections.map((section) => section.heading)).toEqual([null, 'Первый']);
    expect(sections[0].blocks).toHaveLength(1);
    expect(sections[1].blocks).toHaveLength(1);
  });

  it('L7: пустая строка делит абзацы', () => {
    const blocks = parseLegalDocument('Первый абзац.\n\nВторой абзац.');

    expect(blocks.map((block) => block.type)).toEqual(['paragraph', 'paragraph']);
  });

  it('L8: «- а / - б» сразу после абзаца, без пустой строки, — маркированный список из двух пунктов', () => {
    const blocks = parseLegalDocument('Заказ включает:\n- тариф;\n- сроки.');

    expect(blocks).toEqual([
      { type: 'paragraph', content: [{ text: 'Заказ включает:', strong: false }] },
      {
        type: 'list',
        ordered: false,
        items: [[{ text: 'тариф;', strong: false }], [{ text: 'сроки.', strong: false }]],
      },
    ]);
  });

  it.each([
    ['offer.md', 14],
    ['how-we-work.md', 9],
  ] as const)(
    'L9: %s — один заголовок «#», %i разделов «##», пунктов договора «N.N.» среди списков нет',
    (file, headings) => {
      const blocks = parseLegalDocument(read(file));
      const items = blocks.flatMap((block) => (block.type === 'list' ? block.items.map(plain) : []));

      expect(blocks.filter((block) => block.type === 'title')).toHaveLength(1);
      expect(blocks.filter((block) => block.type === 'heading')).toHaveLength(headings);
      expect(items.filter((item) => /^\d+\.\d+\./.test(item))).toEqual([]);
      expect(
        blocks.some((block) => block.type === 'list' && block.ordered && /^\d+\.\d+\./.test(plain(block.items[0]))),
      ).toBe(false);
    },
  );
});
