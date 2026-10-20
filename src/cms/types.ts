import type { Payload } from 'payload';
import type { ReportPeriod } from '../lib/crm/types';
import type { Case, User } from '../payload-types';

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
  coverCaption: string | null;
};

/** Страница кейса: карточка плюс задача, решение и скрин Lighthouse. */
export type CaseDetail = CaseCard & {
  task: string;
  solution: string;
  lighthouse: CaseImage | null;
};

/** Соседние поля документа, из которых хуки собирают адрес. */
export type SlugSource = { slug?: string | null; title?: string | null };

/** Загрузка отчета по каналам: права — от пользователя, период — дни по Москве включительно. */
export type GetChannelReportOptions = { payload: Payload; user?: User | null; period: ReportPeriod };
