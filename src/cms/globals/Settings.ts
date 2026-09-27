import type { GlobalConfig } from 'payload';
import { anyone, isAdmin } from '../access';

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Настройки',
  access: { read: anyone, update: isAdmin },
  fields: [{ name: 'email', type: 'email', label: 'Почта для связи' }],
};
