import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN, DESIGN_DEFAULT_THEME, DESIGN_LABELS, DESIGN_NAMES } from '@/designs/consts';
import { resolveDesign } from '@/designs/resolve';

describe('реестр направлений', () => {
  it.each([undefined, null, '', 'bogus', 'KINETIC '])('resolveDesign(%o) отдает дефолт', (value) => {
    expect(resolveDesign(value)).toBe(DEFAULT_DESIGN);
  });

  it.each([...DESIGN_NAMES])('resolveDesign("%s") сохраняет известное направление', (design) => {
    expect(resolveDesign(design)).toBe(design);
  });

  it('дефолтное направление — kinetic (D10)', () => {
    expect(DEFAULT_DESIGN).toBe('kinetic');
  });

  it('в реестре все пять направлений (D10)', () => {
    expect([...DESIGN_NAMES]).toEqual(['kinetic', 'terminal', 'pop', 'swiss', 'editorial']);
  });

  it('тема по умолчанию у каждого направления — как на его артборде', () => {
    expect(DESIGN_DEFAULT_THEME).toEqual({
      kinetic: 'dark',
      terminal: 'dark',
      pop: 'light',
      swiss: 'light',
      editorial: 'light',
    });
  });

  it.each([...DESIGN_NAMES])('у направления %s есть подпись для пилюли', (design) => {
    expect(DESIGN_LABELS[design]).toMatch(/^[A-Z][a-z]+$/);
  });
});
