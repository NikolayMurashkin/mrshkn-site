import type { ThreeDPosters, ThreeDVideo } from './types';

/** Тариф «3D-интерактив»: одна строка прайса, два варианта со своей ценой на странице услуги. */
export const THREE_D_PLAN_ID = 'threeD';

/** Демо «Автосервис» — живой пример 3D-блока; у каждого языка своя версия. */
export const threeDDemoHref = (locale: string): string => `https://auto.mrshkn.com/${locale}`;

/** Источник единственной цифры про поддержку WebGL 2.0 на странице. */
export const THREE_D_WEBGL_SOURCE = 'https://caniuse.com/webgl2';

/**
 * Вертикальные постер и ролик 4:5 — только на узком экране в портретной ориентации; телефон, повернутый
 * горизонтально, получает 16:9. То же условие у рамки кадра в CSS направлений.
 */
export const THREE_D_TALL_QUERY = '(max-width: 720px) and (orientation: portrait)';

/** Кадр демо на языке страницы: интерфейс демо на постере совпадает с языком сайта, файлы есть у каждого языка. */
export const threeDPosters = (locale: string): ThreeDPosters => ({
  wide: {
    avif: `/services/3d/poster-wide-${locale}.avif`,
    webp: `/services/3d/poster-wide-${locale}.webp`,
    width: 1280,
    height: 720,
  },
  tall: {
    avif: `/services/3d/poster-tall-${locale}.avif`,
    webp: `/services/3d/poster-tall-${locale}.webp`,
    width: 720,
    height: 900,
  },
});

/** Ролики записаны только на русском интерфейсе демо → на остальных языках остается постер и ссылка на демо. */
export const THREE_D_VIDEOS: Partial<Record<string, ThreeDVideo>> = {
  ru: { wide: '/services/3d/demo-wide-ru.mp4', tall: '/services/3d/demo-tall-ru.mp4' },
};
