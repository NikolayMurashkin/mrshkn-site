import { cookies } from 'next/headers';
import { parseConsent } from './consent';
import { CONSENT_COOKIE, GA_ID_PATTERN, METRIKA_ID_PATTERN } from './consts';
import type { AnalyticsIds, ConsentChoice } from './types';

export const getConsent = async (): Promise<ConsentChoice | null> =>
  parseConsent((await cookies()).get(CONSENT_COOKIE)?.value);

const idOrNull = (value: string | undefined, pattern: RegExp) => {
  const id = value?.trim();

  return id && pattern.test(id) ? id : null;
};

/** ID счетчиков читаются на запросе, а не при сборке: образ один, ID ставятся переменными на сервере. */
export const getAnalyticsIds = (): AnalyticsIds => ({
  metrikaId: idOrNull(process.env.METRIKA_ID, METRIKA_ID_PATTERN),
  gaId: idOrNull(process.env.GA4_ID, GA_ID_PATTERN),
});
