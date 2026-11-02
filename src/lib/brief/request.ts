import type { NextRequest } from 'next/server';
import { UTM_COOKIE } from './consts';
import { parseMarks } from './lead';
import type { LeadContext } from './types';

/**
 * Берется последний адрес в `x-forwarded-for`, а не первый: первый присылает сам клиент, и лимит
 * обходился бы одной строкой заголовка. Последний дописывает наш прокси — ему и верим.
 */
export const addressOf = (request: NextRequest) => {
  const forwarded = request.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((address) => address.trim())
    .filter(Boolean);

  return forwarded?.at(-1) || request.headers.get('x-real-ip') || 'unknown';
};

const pageOf = (request: NextRequest) => {
  const referer = request.headers.get('referer');

  if (!referer) {
    return '/';
  }

  try {
    return new URL(referer).pathname;
  } catch {
    return '/';
  }
};

/** Что известно о заявке помимо формы: метки кампании из cookie и страница, с которой ее отправили. */
export const leadContextOf = (request: NextRequest): LeadContext => ({
  marks: parseMarks(request.cookies.get(UTM_COOKIE)?.value),
  page: pageOf(request),
});
