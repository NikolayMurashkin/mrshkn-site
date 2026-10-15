import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload';
import { LOCALES } from '../../i18n/consts';
import { REVIEW_STATUSES } from '../../lib/review/consts';
import {
  isAdmin,
  isAdminField,
  isAdminOrLinkAllowed,
  isAdminOrPublished,
  isAdminOrTranslationApproved,
} from '../access';
import {
  REVIEW_ERASED_FIELDS,
  REVIEW_INVITE_BUTTON,
  REVIEW_LOCALE_LABELS,
  REVIEW_STATUS_LABELS,
  Role,
} from '../consts';

const LOCALE_OPTIONS = LOCALES.map((value) => ({ value, label: REVIEW_LOCALE_LABELS[value] }));

/** Поля, которые читает только администратор: почта, код, ФИО, тексты документов и запреты автора. */
const ADMIN_ONLY = { read: isAdminField };

/** Перевод публичен, только когда автор его подтвердил. */
const TRANSLATION_ACCESS = { read: isAdminOrTranslationApproved };

/** Значения ставят обработчики приглашения и формы, а не карточка в админке. */
const SYSTEM = { readOnly: true };

/**
 * Отзыв согласия: стираются данные автора, перевод и «другое» из запретов; остаются отметки запретов, проект, почта
 * и даты — по ним видно, что отзыв был и когда согласие отозвано. Отметки собираются из записи и правки явно: группа
 * в правке может прийти неполной. Повторное сохранение отозванного не дает вписать данные обратно.
 */
const eraseOnWithdrawal: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if ((data.status ?? originalDoc?.status) !== 'withdrawn') {
    return data;
  }

  const withdrawnAt =
    originalDoc?.status === 'withdrawn' && originalDoc.withdrawnAt ? originalDoc.withdrawnAt : new Date().toISOString();

  const erased = structuredClone(REVIEW_ERASED_FIELDS);
  const restrictions = { ...originalDoc?.restrictions, ...data.restrictions, ...erased.restrictions };

  return { ...data, ...erased, restrictions, withdrawnAt };
};

const AUTHOR_FIELDS: Field[] = [
  { name: 'locale', type: 'select', label: 'Язык отзыва', options: LOCALE_OPTIONS, admin: SYSTEM },
  { name: 'fullName', type: 'text', label: 'ФИО (для согласия, не публикуется)', access: ADMIN_ONLY },
  { name: 'signature', type: 'text', label: 'Подпись' },
  { name: 'occupation', type: 'text', label: 'Дело или должность' },
  { name: 'link', type: 'text', label: 'Ссылка', access: { read: isAdminOrLinkAllowed } },
  {
    name: 'answers',
    type: 'group',
    label: 'Ответы',
    fields: [
      { name: 'before', type: 'textarea', label: 'С чем пришли' },
      { name: 'process', type: 'textarea', label: 'Как шла работа' },
      { name: 'after', type: 'textarea', label: 'Что изменилось' },
    ],
  },
];

const CONSENT_FIELDS: Field[] = [
  { name: 'consentText', type: 'textarea', label: 'Текст согласия', access: ADMIN_ONLY, admin: SYSTEM },
  { name: 'licenseText', type: 'textarea', label: 'Текст разрешения', access: ADMIN_ONLY, admin: SYSTEM },
  { name: 'consentVersion', type: 'text', label: 'Редакция документов', admin: SYSTEM },
  {
    name: 'consentAt',
    type: 'date',
    label: 'Дата согласия',
    admin: { ...SYSTEM, date: { pickerAppearance: 'dayAndTime' } },
  },
  {
    name: 'restrictions',
    type: 'group',
    label: 'Условия и запреты автора',
    access: ADMIN_ONLY,
    admin: SYSTEM,
    fields: [
      { name: 'noTransfer', type: 'checkbox', label: 'Запрещает передавать третьим лицам' },
      { name: 'noLink', type: 'checkbox', label: 'Запрещает публиковать ссылку' },
      { name: 'other', type: 'text', label: 'Другое' },
    ],
  },
  {
    name: 'withdrawnAt',
    type: 'date',
    label: 'Дата отзыва согласия',
    admin: { ...SYSTEM, date: { pickerAppearance: 'dayAndTime' } },
  },
];

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Отзыв', plural: 'Отзывы' },
  admin: {
    useAsTitle: 'project',
    defaultColumns: ['project', 'status', 'inviteLocale', 'updatedAt'],
    hidden: ({ user }) => user?.role !== Role.Admin,
    components: { edit: { beforeDocumentControls: [REVIEW_INVITE_BUTTON] } },
  },
  access: { read: isAdminOrPublished, create: isAdmin, update: isAdmin, delete: isAdmin },
  /**
   * Права на ссылку и перевод читают отметки `restrictions.noLink` и `translation.approved` → при узком `select` их
   * подмешивает `forceSelect`, и права отдают ссылку и перевод там, где они разрешены. Утечку закрывает не он, а сами
   * права: нет отметки — нет ссылки. Группы — целиком: выбор по полям при слиянии сужает группу, выбранную целиком.
   */
  forceSelect: { restrictions: true, translation: true },
  hooks: { beforeChange: [eraseOnWithdrawal] },
  fields: [
    { name: 'project', type: 'text', label: 'Проект', required: true },
    { name: 'case', type: 'relationship', label: 'Кейс', relationTo: 'cases' },
    { name: 'email', type: 'email', label: 'Почта клиента', required: true, access: ADMIN_ONLY },
    {
      name: 'inviteLocale',
      type: 'select',
      label: 'Язык приглашения',
      required: true,
      defaultValue: 'ru',
      options: LOCALE_OPTIONS,
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      required: true,
      defaultValue: 'invited',
      options: REVIEW_STATUSES.map((value) => ({ value, label: REVIEW_STATUS_LABELS[value] })),
    },
    { name: 'code', type: 'text', label: 'Код ссылки', unique: true, index: true, access: ADMIN_ONLY, admin: SYSTEM },
    {
      name: 'sentAt',
      type: 'date',
      label: 'Приглашение отправлено',
      admin: { ...SYSTEM, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: 'Ссылка действует до',
      admin: { ...SYSTEM, date: { pickerAppearance: 'dayAndTime' } },
    },
    ...AUTHOR_FIELDS,
    ...CONSENT_FIELDS,
    {
      name: 'translation',
      type: 'group',
      label: 'Перевод',
      fields: [
        { name: 'text', type: 'textarea', label: 'Текст на втором языке', access: TRANSLATION_ACCESS },
        { name: 'approved', type: 'checkbox', label: 'Перевод подтвержден автором' },
        { name: 'approvedAt', type: 'date', label: 'Дата подтверждения', access: TRANSLATION_ACCESS },
      ],
    },
  ],
};
