import { PSI_HOME, PSI_REPORT_URL, SITE_URL_DEFAULT_SCHEME, SITE_URL_MAX_LENGTH, SITE_URL_PROTOCOLS } from './consts';

/**
 * Адрес сайта из формы → один вид для заявки и ссылки на тест: схема `http(s)` (без схемы — `https://`), хост
 * в нижнем регистре, кириллица — punycode, путь `/` по умолчанию; так делает сам `URL`. Не сайт — null: пустая
 * строка, пробел внутри, чужая схема, логин в адресе (`mailto:a@x.ru` после дописанной схемы разобрался бы
 * как логин и хост), хост без точки (`localhost`), слишком длинная строка.
 */
export const normalizeSiteUrl = (input: string): string | null => {
  const value = input.trim();

  if (!value || /\s/u.test(value) || value.length > SITE_URL_MAX_LENGTH) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(value.includes('://') ? value : `${SITE_URL_DEFAULT_SCHEME}${value}`);
  } catch {
    return null;
  }

  if (!SITE_URL_PROTOCOLS.includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) {
    return null;
  }

  return url.href.length > SITE_URL_MAX_LENGTH ? null : url.href;
};

/** Ссылка «Проверить самому»: отчет PageSpeed Insights для телефона по адресу из формы, без адреса — главная теста. */
export const psiUrl = (input: string): string => {
  const siteUrl = normalizeSiteUrl(input);

  return siteUrl ? `${PSI_REPORT_URL}?url=${encodeURIComponent(siteUrl)}&form_factor=mobile` : PSI_HOME;
};
