import { useTranslations } from 'next-intl';
import { STUDIO_PHONE, STUDIO_PHONE_HREF } from '@/lib/consts';
import type { PhoneLinkProps } from './types';

/**
 * Телефон студии с подписью для шапки, панели мобильного меню и подвала любого направления. Вид — глобальные
 * классы `phone-link*`: общий CSS-модуль склеился бы с чанками всех направлений.
 */
export const PhoneLink = ({ className }: PhoneLinkProps) => {
  const t = useTranslations('footer');

  return (
    <a
      className={className ? `phone-link ${className}` : 'phone-link'}
      href={STUDIO_PHONE_HREF}
    >
      <span className="phone-link-label">{t('phoneLabel')}</span>{' '}
      <span
        className="phone-link-number"
        translate="no"
      >
        {STUDIO_PHONE}
      </span>
    </a>
  );
};
