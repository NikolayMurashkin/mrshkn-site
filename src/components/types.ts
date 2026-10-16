import type { ReactNode } from 'react';
import type { CaseImage as CaseImageData } from '@/cms/types';
import type { ThreeDPoster, ThreeDPosters, ThreeDVideo } from '@/content/types';
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

export type TelegramLinkProps = {
  /** Класс кнопки из DS направления: ссылка своей верстки не несет. */
  className: string;
  children: ReactNode;
};

export type BottomDockProps = {
  /** Cookie-баннер направления и пилюля «Стиль». */
  children: ReactNode;
};

/** Классы постера и ролика из DS направления: логика общая, вид — свой у каждого направления. */
export type ServiceMediaClasses = {
  frame: string;
  poster: string;
  video: string;
  play: string;
};

/** Ролик, выбранный по ширине в момент нажатия, и его постер той же ориентации. */
export type ServiceMediaPlaying = { src: string; poster: ThreeDPoster };

export type ServiceMediaProps = {
  posters: ThreeDPosters;
  /** null — ролика на этом языке нет: только постер, без кнопки. */
  video: ThreeDVideo | null;
  classes: ServiceMediaClasses;
};
