import { WORK_PAGE_PATH } from '@/content/work';
import { WORK_NAV_ITEM } from './consts';

/** Пункт «Кейсы» ведет на страницу всех кейсов, которой без кейсов нет (404), — значит, и пункта нет. */
export const visibleNavItems = <TItem extends string>(items: readonly TItem[], hasCases: boolean): TItem[] =>
  items.filter((item) => hasCases || item !== WORK_NAV_ITEM);

/**
 * Адрес пункта меню: «Кейсы» — страница всех кейсов, остальные — абсолютные якоря главной `/<locale>#<секция>`:
 * шапка стоит на каждой странице, а секции с этими `id` — только на главной.
 */
export const navHref = (locale: string, item: string) =>
  item === WORK_NAV_ITEM ? `/${locale}${WORK_PAGE_PATH}` : `/${locale}#${item}`;

/** Текущая страница для пункта «Кейсы»: страница всех кейсов или страница кейса (путь без локали). */
export const isWorkPath = (pathname: string) =>
  pathname === WORK_PAGE_PATH || pathname.startsWith(`${WORK_PAGE_PATH}/`);
