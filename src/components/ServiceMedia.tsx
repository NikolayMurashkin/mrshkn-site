'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { THREE_D_TALL_QUERY } from '@/content/three-d';
import { EXPECTED_PLAY_ERRORS } from './consts';
import { PlayIcon } from './icons';
import type { ServiceMediaPlaying, ServiceMediaProps } from './types';

/**
 * Постер, а ролик — только по нажатию: до клика в разметке нет `<video>`, и на телефоне ни байта видео
 * не грузится. Ориентация ролика выбирается в момент нажатия по той же ширине, что и постер в `<picture>`.
 */
export const ServiceMedia = ({ posters, video, classes }: ServiceMediaProps) => {
  const t = useTranslations('servicePage.threeD');
  const [playing, setPlaying] = useState<ServiceMediaPlaying | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = videoRef.current;

    if (!playing || !element) {
      return;
    }

    element.focus();
    element.play().catch((error: unknown) => {
      if (error instanceof DOMException && EXPECTED_PLAY_ERRORS.includes(error.name)) {
        return;
      }

      console.error('Ролик услуги не запустился:', error);
    });
  }, [playing]);

  const start = () => {
    if (!video) {
      return;
    }

    const isTall = window.matchMedia(THREE_D_TALL_QUERY).matches;

    setPlaying(isTall ? { src: video.tall, poster: posters.tall } : { src: video.wide, poster: posters.wide });
  };

  return (
    <div className={classes.frame}>
      {playing ? (
        <video
          ref={videoRef}
          className={classes.video}
          src={playing.src}
          poster={playing.poster.webp}
          width={playing.poster.width}
          height={playing.poster.height}
          aria-label={t('videoLabel')}
          controls
          muted
          playsInline
        />
      ) : (
        <>
          <picture>
            <source
              media={THREE_D_TALL_QUERY}
              type="image/avif"
              srcSet={posters.tall.avif}
              width={posters.tall.width}
              height={posters.tall.height}
            />
            <source
              media={THREE_D_TALL_QUERY}
              type="image/webp"
              srcSet={posters.tall.webp}
              width={posters.tall.width}
              height={posters.tall.height}
            />
            <source
              type="image/avif"
              srcSet={posters.wide.avif}
              width={posters.wide.width}
              height={posters.wide.height}
            />
            <img
              className={classes.poster}
              src={posters.wide.webp}
              width={posters.wide.width}
              height={posters.wide.height}
              alt={t('posterAlt')}
              decoding="async"
            />
          </picture>
          {video ? (
            <button
              type="button"
              className={classes.play}
              onClick={start}
            >
              <PlayIcon size={20} />
              {t('play')}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
};
