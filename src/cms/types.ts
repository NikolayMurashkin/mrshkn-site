import type { Case } from '../payload-types';
import type { TEAM_ROLES } from './consts';

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

/** Роль человека в проекте — одна из ролей коллекции `team`. */
export type TeamRole = (typeof TEAM_ROLES)[number];

/** Участник команды, как его видит фронт: роль, год начала в профессии, «о себе», навыки и фото. */
export type TeamMember = {
  name: string;
  role: TeamRole;
  yearsSince: number;
  about: string | null;
  skills: string[];
  photo: CaseImage | null;
};
