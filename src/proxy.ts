import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { UTM_COOKIE, UTM_COOKIE_MAX_AGE, UTM_PARAMS } from '@/lib/brief/consts';
import { cleanMark } from '@/lib/brief/lead';
import { LABEL_REDIRECTS } from '@/lib/seo/consts';

const handleLocale = createMiddleware(routing);

/** Кириллицу поисковики присылают в процентной кодировке; битая кодировка — просто не адрес из списка. */
const decodePath = (pathname: string) => {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
};

/**
 * Поисковик разрешает подпись `./…` от пути страницы (`/ru/docs/privacy` → `/ru/docs/как-мы-работаем`) → на глубине
 * от двух сегментов ключ — первый сегмент и последний: подпись чужого языка с ним не совпадет и останется 404.
 */
const findLabelDestination = (path: string): string | undefined => {
  const exact: string | undefined = LABEL_REDIRECTS[path];

  if (exact) {
    return exact;
  }

  const segments = path.split('/').slice(1);

  if (segments.length < 3) {
    return undefined;
  }

  return LABEL_REDIRECTS[`/${segments[0]}/${segments[segments.length - 1]}`];
};

/**
 * Адрес подписи кнопки — до префикса языка от next-intl: иначе адрес без языка ушел бы сначала на `/<язык>/…`
 * по языку браузера, а не подписи. Подпись ловится и последним сегментом адреса любой глубины. Метки запроса едут
 * в адрес назначения.
 */
const redirectLabel = (request: NextRequest) => {
  const destination = findLabelDestination(decodePath(request.nextUrl.pathname));

  if (!destination) {
    return null;
  }

  const url = new URL(destination, request.url);

  url.search = request.nextUrl.search;

  return NextResponse.redirect(url, 308);
};

/**
 * По рекламе приходят на главную, а заявку оставляют на брифе — к моменту отправки метки уже
 * пропали бы из адреса. Поэтому они снимаются на первом же переходе и живут в cookie.
 */
const proxy = (request: NextRequest) => {
  const labelRedirect = redirectLabel(request);

  if (labelRedirect) {
    return labelRedirect;
  }

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

/** Админка и REST Payload живут без префикса языка: `/admin` не должен уезжать на `/ru/admin`. */
export const config = {
  matcher: '/((?!api|admin|_next|.*\\..*).*)',
};
