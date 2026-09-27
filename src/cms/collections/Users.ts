import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import { isAdmin, isAdminField, isAdminOrSelf } from '../access';
import { Role, ROLE_LABELS } from '../consts';

/**
 * Первого пользователя заводит форма админки, когда учетных записей еще нет, и выбрать себе роль он не может —
 * поле роли правит только администратор. Без этого хука первый вход получил бы роль редактора и не смог бы
 * ни завести остальных, ни открыть настройки.
 */
const firstUserIsAdmin: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') {
    return data;
  }

  const { totalDocs } = await req.payload.count({ collection: 'users', req });

  return totalDocs === 0 ? { ...data, role: Role.Admin } : data;
};

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'role'] },
  auth: true,
  access: { read: isAdminOrSelf, create: isAdmin, update: isAdminOrSelf, delete: isAdmin },
  hooks: { beforeChange: [firstUserIsAdmin] },
  fields: [
    {
      name: 'role',
      type: 'select',
      label: 'Роль',
      required: true,
      defaultValue: Role.Editor,
      saveToJWT: true,
      access: { create: isAdminField, update: isAdminField },
      options: Object.values(Role).map((value) => ({ value, label: ROLE_LABELS[value] })),
    },
  ],
};
