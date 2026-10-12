'use client';

import { useTranslations } from 'next-intl';
import { useConsent } from '@/components/Analytics/use-consent';
import { PRIVACY_ANCHOR_PREFIX, PRIVACY_CHOICE_SECTION, PRIVACY_SECTIONS } from './consts';
import type { PrivacySectionText, UsePrivacyPolicy } from './types';

const ANCHORS = PRIVACY_SECTIONS.map((id) => `${PRIVACY_ANCHOR_PREFIX}${id}`);

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
        ...text,
        id,
        anchor: ANCHORS[index],
        items: text.items ?? [],
        choice: id === PRIVACY_CHOICE_SECTION,
      };
    }),
    anchors: ANCHORS,
    reopen,
  };
};
