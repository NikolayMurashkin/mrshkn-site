import { teamInitials } from '@/lib/team';
import { CaseImage } from './CaseImage';
import { TEAM_PHOTO_SIZES } from './consts';
import type { TeamPortraitProps } from './types';

/**
 * Реальное фото из медиатеки, а без него — монограмма из инициалов, если направление ее рисует (передан
 * `monogramClassName`); иначе без фото портрета нет. Стоковых и сгенерированных лиц нет.
 */
export const TeamPortrait = ({ member, photoClassName, monogramClassName }: TeamPortraitProps) => {
  if (member.photo) {
    return (
      <CaseImage
        className={photoClassName}
        image={member.photo}
        sizes={TEAM_PHOTO_SIZES}
      />
    );
  }

  return monogramClassName ? (
    <span
      className={monogramClassName}
      aria-hidden="true"
    >
      {teamInitials(member.name)}
    </span>
  ) : null;
};
