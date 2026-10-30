import { useEffect, useState } from 'react';

/**
 * Совпадает ли медиазапрос сейчас; следит за `change`. До гидрации и без `matchMedia` (рендер в строку, тесты без
 * заглушки) — `false`: разметка сервера и первого кадра клиента одна.
 */
export const useMatchMedia = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);

    update();
    list.addEventListener('change', update);

    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
};
