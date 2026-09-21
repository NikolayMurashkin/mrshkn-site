import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { UTM_COOKIE, UTM_COOKIE_MAX_AGE, UTM_PARAMS } from '@/lib/brief/consts';
import { cleanMark } from '@/lib/brief/lead';

const handleLocale = createMiddleware(routing);

/**
 * По рекламе приходят на главную, а заявку оставляют на брифе — к моменту отправки метки уже
 * пропали бы из адреса. Поэтому они снимаются на первом же переходе и живут в cookie.
 */
const proxy = (request: NextRequest) => {
  const response = handleLocale(request);
  const marks = UTM_PARAMS.flatMap((mark) => {
    const value = request.nextUrl.searchParams.get(mark);

    const clean = value ? cleanMark(value) : '';

    return clean ? [[mark, clean] as const] : [];
  });

  if (marks.length) {
    response.cookies.set(UTM_COOKIE, JSON.stringify(Object.fromEntries(marks)), {
      maxAge: UTM_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      path: '/',
    });
  }

  return response;
};

export default proxy;

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
