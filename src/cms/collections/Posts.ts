import type { CollectionConfig } from 'payload';
import { isSignedIn, publishedOrSignedIn } from '../access';
import { validateSlug } from '../validate';

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Пост', plural: 'Посты' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', '_status', 'updatedAt'] },
  versions: { drafts: true },
  access: { read: publishedOrSignedIn, create: isSignedIn, update: isSignedIn, delete: isSignedIn },
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', required: true, localized: true },
    { name: 'slug', type: 'text', label: 'Адрес', required: true, unique: true, index: true, validate: validateSlug },
    { name: 'excerpt', type: 'textarea', label: 'Анонс', localized: true },
    { name: 'body', type: 'richText', label: 'Текст', localized: true },
  ],
};
