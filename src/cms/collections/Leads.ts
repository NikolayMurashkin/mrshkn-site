import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import { LOCALES } from '../../i18n/consts';
import { LEAD_QUALIFIED_STAGES, LEAD_STAGES } from '../../lib/brief/consts';
import { isSignedIn } from '../access';
import { LEAD_STAGE_LABELS, REVIEW_LOCALE_LABELS } from '../consts';

const DATE_AND_TIME = { date: { pickerAppearance: 'dayAndTime' as const } };

/**
 * Дата квалификации ставится один раз — при первом переходе на «квалифицирована» или дальше, «отказ» ее не дает.
 * Поставленная дата не снимается и не переписывается: значение из правки (в том числе пустое) игнорируется,
 * иначе отчет по квалифицированным заявкам плыл бы от каждого сохранения карточки.
 */
const stampQualification: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (originalDoc?.qualifiedAt) {
    return { ...data, qualifiedAt: originalDoc.qualifiedAt };
  }

  const stage = data.stage ?? originalDoc?.stage;

  return { ...data, qualifiedAt: LEAD_QUALIFIED_STAGES.includes(stage) ? new Date().toISOString() : null };
};

/**
 * Заявки — CRM студии. Их пишет обработчик квиза мимо прав, а читают, правят, удаляют и заводят по звонку только
 * вошедшие в админку: без входа REST не отдает и не принимает ничего. Ответы квиза — ключи справочника как есть,
 * обычным текстом: справочник можно менять, старые заявки от этого не ломаются.
 */
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'stage', 'utm_source', 'createdAt'],
  },
  access: { read: isSignedIn, create: isSignedIn, update: isSignedIn, delete: isSignedIn },
  hooks: { beforeChange: [stampQualification] },
  fields: [
    { name: 'name', type: 'text', label: 'Имя', required: true },
    { name: 'contact', type: 'text', label: 'Связь', required: true },
    { name: 'comment', type: 'textarea', label: 'Комментарий' },
    {
      name: 'stage',
      type: 'select',
      label: 'Этап',
      required: true,
      defaultValue: 'new',
      options: LEAD_STAGES.map((value) => ({ value, label: LEAD_STAGE_LABELS[value] })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'qualifiedAt',
      type: 'date',
      label: 'Дата квалификации',
      admin: { ...DATE_AND_TIME, position: 'sidebar', readOnly: true },
    },
    { name: 'amount', type: 'number', label: 'Сумма сделки, ₽', min: 0, admin: { position: 'sidebar' } },
    {
      name: 'locale',
      type: 'select',
      label: 'Язык заявки',
      options: LOCALES.map((value) => ({ value, label: REVIEW_LOCALE_LABELS[value] })),
      admin: { position: 'sidebar' },
    },
    {
      type: 'collapsible',
      label: 'Ответы квиза',
      fields: [
        { name: 'source', type: 'text', label: 'Источник' },
        { name: 'product', type: 'text', label: 'Продукт' },
        { name: 'niche', type: 'text', label: 'Ниша' },
        { name: 'design', type: 'text', label: 'Стиль' },
        { name: 'timing', type: 'text', label: 'Сроки' },
        { name: 'budget', type: 'text', label: 'Бюджет' },
        { name: 'plan', type: 'text', label: 'Тариф' },
        { name: 'page', type: 'text', label: 'Страница' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Метки рекламы',
      fields: [
        { name: 'utm_source', type: 'text', label: 'utm_source' },
        { name: 'utm_medium', type: 'text', label: 'utm_medium' },
        { name: 'utm_campaign', type: 'text', label: 'utm_campaign' },
        { name: 'utm_content', type: 'text', label: 'utm_content' },
        { name: 'utm_term', type: 'text', label: 'utm_term' },
      ],
    },
    {
      name: 'notes',
      type: 'array',
      label: 'Заметки',
      labels: { singular: 'Заметка', plural: 'Заметки' },
      fields: [
        {
          name: 'date',
          type: 'date',
          label: 'Дата',
          defaultValue: () => new Date().toISOString(),
          admin: DATE_AND_TIME,
        },
        { name: 'text', type: 'textarea', label: 'Текст', required: true },
      ],
    },
  ],
};
