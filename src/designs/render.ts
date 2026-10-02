import { createElement } from 'react';
import type { DesignComponents, SectionProps } from './types';

export const renderSection = (components: DesignComponents, props: SectionProps) => {
  switch (props.section) {
    case 'header':
      return createElement(components.header, { hasCases: props.hasCases });
    case 'works':
      return createElement(components.works, { cases: props.cases });
    case 'case':
      return createElement(components.case, { caseItem: props.caseItem });
    default:
      return createElement(components[props.section]);
  }
};
