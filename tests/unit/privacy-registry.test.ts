import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SECTION_NAMES } from '@/designs/consts';
import { EditorialSection } from '@/designs/editorial';
import { KineticSection } from '@/designs/kinetic';
import { PopSection } from '@/designs/pop';
import { SwissSection } from '@/designs/swiss';
import { TerminalSection } from '@/designs/terminal';
import type { SectionProps } from '@/designs/types';

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

const DESIGN_SECTIONS = [
  ['kinetic', KineticSection],
  ['terminal', TerminalSection],
  ['pop', PopSection],
  ['swiss', SwissSection],
  ['editorial', EditorialSection],
] as const;

type SectionComponent = (typeof DESIGN_SECTIONS)[number][1];

/** Секции политики и баннера без данных: пропсы — только имя секции; что имя есть в реестре, проверяет R0. */
const sectionType = (Section: SectionComponent, section: string) =>
  (Section({ section } as SectionProps) as ReactElement).type;

describe('политика ПД и cookie-баннер в реестре направлений', () => {
  it('R0: в SECTION_NAMES есть privacyPage и cookieBanner', () => {
    expect(SECTION_NAMES).toContain('privacyPage');
    expect(SECTION_NAMES).toContain('cookieBanner');
  });

  it.each(DESIGN_SECTIONS)('R1: %s отдает для privacyPage свой компонент', (design, Section) => {
    const type = sectionType(Section, 'privacyPage');
    const others = DESIGN_SECTIONS.filter(([name]) => name !== design);

    expect(typeof type).toBe('function');
    for (const [otherDesign, OtherSection] of others) {
      expect(type, `privacyPage у ${design} и ${otherDesign}`).not.toBe(sectionType(OtherSection, 'privacyPage'));
    }
  });

  it.each(DESIGN_SECTIONS)('R2: %s отдает для cookieBanner свой компонент', (design, Section) => {
    const type = sectionType(Section, 'cookieBanner');
    const others = DESIGN_SECTIONS.filter(([name]) => name !== design);

    expect(typeof type).toBe('function');
    for (const [otherDesign, OtherSection] of others) {
      expect(type, `cookieBanner у ${design} и ${otherDesign}`).not.toBe(sectionType(OtherSection, 'cookieBanner'));
    }
  });
});
