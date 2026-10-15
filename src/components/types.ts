import type { ReactNode } from 'react';
import type { CaseImage as CaseImageData } from '@/cms/types';
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
