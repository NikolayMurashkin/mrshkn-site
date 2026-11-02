'use client';

import { useTranslations } from 'next-intl';
import { createElement, type ReactNode } from 'react';
import { useConsent } from '@/components/Analytics/use-consent';
import { PRIVACY_ANCHOR_PREFIX, PRIVACY_CHOICE_SECTION, PRIVACY_PLAIN_ANCHORS, PRIVACY_SECTIONS } from './consts';
import type { PrivacySectionText, UsePrivacyPolicy } from './types';

const ANCHORS = PRIVACY_SECTIONS.map((id) =>
  PRIVACY_PLAIN_ANCHORS.includes(id) ? id : `${PRIVACY_ANCHOR_PREFIX}${id}`,
);

const strong = (chunks: ReactNode) => createElement('strong', null, chunks);

export const usePrivacyPolicy = (): UsePrivacyPolicy => {
  const t = useTranslations('privacy');
  const { reopen } = useConsent();

  return {
    kicker: t('kicker'),
    title: t('title'),
    updated: t('updated'),
    tocLabel: t('tocLabel'),
    changeChoice: t('changeChoice'),
    sections: PRIVACY_SECTIONS.map((id, index) => {
      const text = t.raw(`sections.${id}`) as PrivacySectionText;

      return {
        id,
        anchor: ANCHORS[index],
        title: text.title,
        paragraphs: text.paragraphs,
        items: (text.items ?? []).map((item, itemIndex) => ({
          key: item,
          content: t.rich(`sections.${id}.items.${itemIndex}`, { b: strong }),
        })),
        after: text.after ?? [],
        choice: id === PRIVACY_CHOICE_SECTION,
      };
    }),
    anchors: ANCHORS,
    reopen,
  };
};
