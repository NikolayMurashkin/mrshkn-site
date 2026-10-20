import { describe, expect, it } from 'vitest';
import { formatReminder } from '@/cms/reminders';
import { SITE_URL } from '@/lib/consts';

/**
 * Сообщение бота о напоминании: «Напоминание: имя», «Этап: подпись», текст напоминания, если он не пуст, пустая строка
 * и ссылка на карточку. Текст без содержания строки не дает, пробелы по краям срезаются.
 */

const LEAD = { id: 7, name: 'Анна', stage: 'qualified' as const };

const CARD = `Карточка: ${SITE_URL}/admin/collections/leads/7`;

describe('сообщение о напоминании', () => {
  it.each([null, '', '   '])('U1: текст %j — строки текста нет', (remindText) => {
    expect(formatReminder({ ...LEAD, remindText })).toBe(
      ['Напоминание: Анна', 'Этап: Квалифицирована', '', CARD].join('\n'),
    );
  });

  it('U2: текст с пробелами по краям — строка текста без них', () => {
    expect(formatReminder({ ...LEAD, remindText: '  Позвонить про КП  ' })).toBe(
      ['Напоминание: Анна', 'Этап: Квалифицирована', 'Позвонить про КП', '', CARD].join('\n'),
    );
  });
});
