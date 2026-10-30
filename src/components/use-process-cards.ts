'use client';

import { useTranslations } from 'next-intl';
import { PROCESS_CARDS_HEADINGS } from './consts';
import type { ProcessCard, ProcessCards, ProcessCardsBlock, ProcessCardsBlockName } from './types';

/**
 * Карточки «Перед стартом» и «Гарантия после запуска»: главной — из `process`, страницы услуги — из `services.<id>`.
 * Тексты читаются как есть (`raw`): в них нет подстановок, а апостроф английского текста ICU принял бы за экранирование.
 */
export const useProcessCards = (serviceId?: string): ProcessCards => {
  const t = useTranslations();
  const base = serviceId === undefined ? 'process' : `services.${serviceId}`;

  const block = (name: ProcessCardsBlockName): ProcessCardsBlock | null => {
    const key = `${base}.${name}`;

    if (!t.has(key)) {
      return null;
    }

    const cards = Object.entries(t.raw(key) as Record<string, Omit<ProcessCard, 'id'>>).map(([id, card]) => ({
      id,
      title: card.title,
      text: card.text,
    }));

    return cards.length > 0 ? { heading: t(PROCESS_CARDS_HEADINGS[name]), cards } : null;
  };

  return { prestart: block('prestart'), after: block('after') };
};
