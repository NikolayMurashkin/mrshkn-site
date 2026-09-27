import type { CollectionConfig } from 'payload';
import { CONTENT_ACCESS } from '../access';
import { MEDIA_DIR, MEDIA_FORMAT, MEDIA_SIZES } from '../consts';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Картинка', plural: 'Медиатека' },
  access: CONTENT_ACCESS,
  upload: {
    staticDir: MEDIA_DIR,
    mimeTypes: ['image/*'],
    adminThumbnail: 'thumbnail',
    imageSizes: MEDIA_SIZES.map(({ name, width }) => ({ name, width, formatOptions: MEDIA_FORMAT })),
  },
  fields: [{ name: 'alt', type: 'text', label: 'Что на картинке', required: true, localized: true }],
};
