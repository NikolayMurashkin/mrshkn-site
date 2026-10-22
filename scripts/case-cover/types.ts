/** Прямоугольник на холсте обложки: экран ноутбука или телефона. */
export type Rect = { x: number; y: number; width: number; height: number };

/** Шаблон обложки: размер холста и экраны, куда ложатся снимки. */
export type CaseCoverLayout = { width: number; height: number; laptop: Rect; phone: Rect };

/** Вход обложки не годится: файла нет или это не PNG. Сообщение — для человека в терминале. */
export type CaseCoverInputProblem = { message: string };
