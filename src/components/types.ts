import type { CaseImage as CaseImageData, TeamMember } from '@/cms/types';
import type { DesignName } from '@/designs/types';

/** Смена направления, которую переключатель ждет от `router.refresh()`. */
export type PendingSwitch = {
  /** Направление, которое должно прийти пропом после refresh. */
  design: DesignName;
  /** Завершает промис коллбэка View Transition, когда направление пришло. */
  resolve: () => void;
};

export type CaseImageProps = {
  image: CaseImageData;
  sizes: string;
  className?: string;
  /** Картинка на первом экране: грузится сразу и с высоким приоритетом, остальные — лениво. */
  priority?: boolean;
};

export type JsonLdProps = {
  /** Узел schema.org; несколько узлов на странице — несколько компонентов. */
  data: object;
};

export type TeamPortraitProps = {
  member: TeamMember;
  photoClassName: string;
  /** Нет — без фото портрета нет: у направлений без диска в DS пустой квадрат не рисуется. */
  monogramClassName?: string;
};
