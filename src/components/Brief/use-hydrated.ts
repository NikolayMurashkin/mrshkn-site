import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

const clientSnapshot = () => true;

const serverSnapshot = () => false;

/**
 * Квиз смонтирован в браузере: на сервере и при гидрации — `false`, после нее — `true`. Клик по кнопке из разметки
 * сервера до гидрации React теряет молча — ответ не выбирается, «Дальше» остается недоступной, — поэтому кнопки ответов
 * и «Дальше» до гидрации `disabled`. При переходе на квиз без перезагрузки сразу `true`, лишнего рендера нет.
 */
export const useHydrated = () => useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
