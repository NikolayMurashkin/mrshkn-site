import { createElement } from 'react';
import { useTranslations } from 'next-intl';
import { PRICING_BASIC_GROUPS } from '@/content/pricing';
import { EditorialDashes } from './Dashes';
import type { EditorialBasicsProps } from './types';
import styles from './Basics.module.scss';

export const EditorialBasics = ({ titleTag, narrow = false }: EditorialBasicsProps) => {
  const t = useTranslations('pricing');

  return (
    <div
      className={narrow ? `${styles.groups} ${styles.narrow}` : styles.groups}
      data-testid="basics"
    >
      {PRICING_BASIC_GROUPS.map((group) => (
        <div
          className={styles.group}
          data-testid="basics-group"
          key={group.id}
        >
          {createElement(titleTag, { className: styles.title }, t(`basicsGroups.${group.id}`))}
          <EditorialDashes items={group.items.map((item) => t(`basics.${item}`))} />
        </div>
      ))}
    </div>
  );
};
