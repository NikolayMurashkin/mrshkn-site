import { WORK_NAV_ITEM } from './consts';

/** Пункт «Кейсы» ведет на секцию, которой без кейсов на главной нет, — значит, и пункта нет (D21). */
export const visibleNavItems = <TItem extends string>(items: readonly TItem[], hasCases: boolean): TItem[] =>
  items.filter((item) => hasCases || item !== WORK_NAV_ITEM);
