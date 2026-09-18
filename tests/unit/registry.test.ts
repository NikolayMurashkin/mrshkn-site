import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN, DESIGN_NAMES } from '@/designs/consts';
import { getSection, resolveDesign } from '@/designs/registry';

describe('реестр направлений', () => {
  it.each([...DESIGN_NAMES])('getSection("%s", "hero") возвращает компонент', (design) => {
    expect(getSection(design, 'hero')).toBeTypeOf('function');
  });

  it('неизвестное направление отдает секцию дефолтного направления', () => {
    expect(getSection('bogus', 'hero')).toBe(getSection(DEFAULT_DESIGN, 'hero'));
  });

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
});
