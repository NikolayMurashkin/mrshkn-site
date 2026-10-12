import { CONSENT_COOKIE, CONSENT_MAX_AGE, CONSENT_VALUES } from './consts';
import type { ConsentChoice } from './types';

export const parseConsent = (value: string | undefined | null): ConsentChoice | null =>
  CONSENT_VALUES.find((choice) => choice === value) ?? null;

/** Строка для `document.cookie`: выбор на весь сайт и на год. */
export const consentCookie = (choice: ConsentChoice): string =>
  `${CONSENT_COOKIE}=${choice}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax`;

/** Строка для `document.cookie`, стирающая выбор: баннер спросит снова. */
export const clearedConsentCookie = (): string => `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
