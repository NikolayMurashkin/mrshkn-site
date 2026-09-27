import type { CollectionConfig } from 'payload';
import { CONTENT_ACCESS } from '../access';
import { DESIGN_LABELS, DESIGN_NAMES } from '../../designs/consts';
import { CASE_KIND_LABELS, CASE_KINDS, CASE_NICHES, SLUG_ADMIN } from '../consts';
import { fillSlug, validateSlug } from '../slug';

export const Cases: CollectionConfig = {
  slug: 'cases',
  labels: { singular: 'Кейс', plural: 'Кейсы' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'kind', 'niche', 'design'] },
  access: CONTENT_ACCESS,
  fields: [
    { name: 'title', type: 'text', label: 'Название', required: true, localized: true },
    {
      name: 'slug',
      type: 'text',
      label: 'Адрес',
      required: true,
      unique: true,
      index: true,
      admin: SLUG_ADMIN,
      hooks: { beforeValidate: [fillSlug] },
      validate: validateSlug,
    },
    {
      name: 'kind',
      type: 'select',
      label: 'Что это',
      required: true,
      options: CASE_KINDS.map((value) => ({ value, label: CASE_KIND_LABELS[value] })),
    },
    { name: 'niche', type: 'select', label: 'Ниша', required: true, options: [...CASE_NICHES] },
    {
      name: 'design',
      type: 'select',
      label: 'Направление',
      required: true,
      options: DESIGN_NAMES.map((value) => ({ value, label: DESIGN_LABELS[value] })),
    },
    { name: 'demoUrl', type: 'text', label: 'Ссылка на демо' },
  ],
};
