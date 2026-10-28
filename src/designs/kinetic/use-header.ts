import { useEffect, useRef, useState } from 'react';

/** Линия под шапкой появляется, когда сторож наверху страницы ушел из окна: IntersectionObserver, без scroll-слушателя. */
export const useScrolled = () => {
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const node = sentinel.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return { sentinel, scrolled };
};
