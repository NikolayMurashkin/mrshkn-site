import type { CollectionConfig } from 'payload';
import { CONTENT_ACCESS } from '../access';
import { TEAM_ROLE_LABELS, TEAM_ROLES } from '../consts';

export const Team: CollectionConfig = {
  slug: 'team',
  labels: { singular: 'Участник', plural: 'Команда' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'role', 'core', 'yearsSince'] },
  access: CONTENT_ACCESS,
  fields: [
    { name: 'name', type: 'text', label: 'Имя', required: true, localized: true },
    {
      name: 'role',
      type: 'select',
      label: 'Роль в проекте',
      required: true,
      options: TEAM_ROLES.map((value) => ({ value, label: TEAM_ROLE_LABELS[value] })),
    },
    { name: 'core', type: 'checkbox', label: 'Ядро студии', defaultValue: false },
    { name: 'yearsSince', type: 'number', label: 'В профессии с года', required: true },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фото' },
    { name: 'about', type: 'textarea', label: 'Коротко о себе', localized: true },
  ],
};
