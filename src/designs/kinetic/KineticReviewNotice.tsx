import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRightIcon } from './icons';
import type { KineticReviewNoticeProps } from './types';
import { KINETIC_REVIEW_CLASS as cls } from './consts';

export const KineticReviewNotice = ({ view }: KineticReviewNoticeProps) => {
  const t = useTranslations('review');

  return (
    <main
      className={cls.notice}
      data-testid={`review-${view}`}
    >
      <p className={cls.kicker}>{t('kicker')}</p>
      <h1 className={cls.noticeTitle}>{t(`${view}.title`)}</h1>
      <p className={cls.noticeText}>{t(`${view}.text`)}</p>
      <Link
        className={cls.button}
        href="/"
      >
        {t('home')}
        <ArrowRightIcon />
      </Link>
    </main>
  );
};
