import type { JsonLdProps } from './types';

/** Разметка schema.org в `<script>`: `<` экранируется, иначе текст с `</script>` закрыл бы тег. */
export const JsonLd = ({ data }: JsonLdProps) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
  />
);
