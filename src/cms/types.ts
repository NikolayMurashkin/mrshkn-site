import type { Case } from '../payload-types';

/** Картинка медиатеки для `<img>`: адреса нарезанных размеров уже собраны в `srcSet`. */
export type CaseImage = {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  srcSet: string | null;
};

type CaseMetric = { value: string; label: string };

/** Кейс, как его видит фронт: только поля карточки, без служебных полей Payload. */
export type CaseCard = Pick<Case, 'title' | 'slug' | 'kind' | 'niche' | 'design'> & {
  demoUrl: string | null;
  metrics: CaseMetric[];
  cover: CaseImage;
};

/** Страница кейса: карточка плюс задача, решение и скрин Lighthouse. */
export type CaseDetail = CaseCard & {
  task: string;
  solution: string;
  lighthouse: CaseImage | null;
};

/** Соседние поля документа, из которых хуки собирают адрес. */
export type SlugSource = { slug?: string | null; title?: string | null };
