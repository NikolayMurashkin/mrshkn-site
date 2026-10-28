/**
 * Высота липкой строки меню Editorial (14 + 18 + 14 + линейка 1): линия, на которой `useActiveSection` считает раздел
 * текущим. Мастхед над ней не липнет — та же сумма в `_shared.scss` (`$nav-height`).
 */
export const EDITORIAL_NAV_OFFSET = 47;

export const EDITORIAL_STUDIO_EMAIL = 'hello@mrshkn.com';

/** Раскладка «Кейсов» по числу материалов: один — на 12 колонок, два — 7 + 5, три и больше — разворот DS. */
export const EDITORIAL_WORKS_LAYOUTS = { 1: 'single', 2: 'pair' } as const;

export const EDITORIAL_WORKS_SPREAD = 'spread';

/** Обложка главного материала — 7 колонок из 12, с 1080 — на всю ширину. */
export const EDITORIAL_LEAD_COVER_SIZES = '(max-width: 1080px) 100vw, 60vw';

/** Обложка бокового материала — 2/5 от 5 колонок, с 1080 — половина, с 720 — вся ширина. */
export const EDITORIAL_SIDE_COVER_SIZES = '(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 25vw';

/** Обложка материала с четвертого — карточка на 6 колонок из 12, с 720 — вся ширина. */
export const EDITORIAL_ROW_COVER_SIZES = '(max-width: 720px) 100vw, 50vw';

/** Сколько первых материалов стоят в развороте (главный и два боковых); дальше — ряды по два. */
export const EDITORIAL_SPREAD_SIZE = 3;
