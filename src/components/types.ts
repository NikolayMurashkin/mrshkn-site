import type { ReactNode } from 'react';
import type { CaseImage as CaseImageData } from '@/cms/types';
import type { ProcessScaleSegment, ThreeDPoster, ThreeDPosters, ThreeDVideo } from '@/content/types';
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

/** Отрезок шкалы «дни и паузы» с подписями на языке страницы. */
export type ProcessScaleItem = ProcessScaleSegment & {
  key: string;
  label: string;
  /** Подпись платежа на отрезке, если он есть. */
  paymentLabel: string | null;
  /** Платеж в конце отрезка (после приемки), а не в начале. */
  isPaymentAtEnd: boolean;
};

export type ProcessScaleLegendKind = 'style' | 'day' | 'pause';

/** Пункт легенды шкалы: вид образца и ключ подписи `process.scale.legend.*`. */
export type ProcessScaleLegendEntry = {
  kind: ProcessScaleLegendKind;
  key: 'style' | 'work' | 'pause';
};

/** Классы шкалы «дни и паузы» — от направления: своего CSS у компонента нет. */
export type ProcessScaleClasses = {
  scale: string;
  track: string;
  segment: string;
  style: string;
  day: string;
  pause: string;
  bar: string;
  /** Подпись отрезка и платеж: на компьютере раскладываются по строкам шкалы, на телефоне идут в одну строку. */
  caption: string;
  label: string;
  payment: string;
  paymentEnd: string;
  legend: string;
  legendItem: string;
  swatch: string;
  swatchStyle: string;
  swatchDay: string;
  swatchPause: string;
};

export type ProcessScaleProps = {
  classes: ProcessScaleClasses;
  /** Содержимое полосы отрезка (цифра дня, фишка, образцы цвета) — у каждого направления свое; полоса скрыта от скринридера. */
  renderBar?: (item: ProcessScaleItem) => ReactNode;
};

/** Блок карточек секции процесса: «Перед стартом» над шагами, «Гарантия после запуска» под ними. */
export type ProcessCardsBlockName = 'prestart' | 'after';

/** Карточка блока: `id` — ключ в переводах, порядок карточек — порядок ключей. */
export type ProcessCard = {
  id: string;
  title: string;
  text: string;
};

export type ProcessCardsBlock = {
  heading: string;
  cards: ProcessCard[];
};

/** Оба блока главной или страницы услуги; `null` — у страницы блока нет, пустым он не выводится. */
export type ProcessCards = Record<ProcessCardsBlockName, ProcessCardsBlock | null>;
