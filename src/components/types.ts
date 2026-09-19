import type { DesignName } from '@/designs/types';

/** Смена направления, которую переключатель ждет от `router.refresh()`. */
export type PendingSwitch = {
  /** Направление, которое должно прийти пропом после refresh. */
  design: DesignName;
  /** Завершает промис коллбэка View Transition, когда направление пришло. */
  resolve: () => void;
};
