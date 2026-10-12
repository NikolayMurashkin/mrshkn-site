/**
 * Сумма лет опыта людей команды: у каждого — от года начала в профессии до `year`. Год из будущего (опечатка
 * в админке) дает человеку 0, а не отрицательный стаж, который съел бы опыт остальных.
 */
export const teamExperienceYears = (
  members: { yearsSince: number }[],
  year: number = new Date().getFullYear(),
): number => members.reduce((total, { yearsSince }) => total + Math.max(0, year - yearsSince), 0);

/** Монограмма вместо фото: первые буквы двух первых слов имени («Имя Фамилия» → «ИФ»), одно слово — одна буква. */
export const teamInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase())
    .join('');
