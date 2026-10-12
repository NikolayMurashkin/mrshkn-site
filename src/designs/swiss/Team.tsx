import { useTranslations } from 'next-intl';
import { TeamPortrait } from '@/components/TeamPortrait';
import { teamSection } from '../team';
import type { TeamProps } from '../types';
import type { SwissTeamCardProps } from './types';
import styles from './Team.module.scss';

const SwissTeamCard = ({ card }: SwissTeamCardProps) => {
  const t = useTranslations('team');
  const { member, network, skills, onCall } = card;

  return (
    <article
      className={network ? `${styles.member} ${styles.network}` : styles.member}
      data-testid="team-member"
    >
      <TeamPortrait
        member={member}
        photoClassName={styles.photo}
      />
      <span className={styles.kicker}>{t(`roles.${member.role}`)}</span>
      <h3 className={styles.name}>{member.name}</h3>
      <span className={styles.since}>{t('since', { year: String(member.yearsSince) })}</span>
      {member.about ? <p className={styles.about}>{member.about}</p> : null}
      {skills.length > 0 || onCall ? (
        <div className={styles.tags}>
          {skills.length > 0 ? (
            <ul
              className={styles.skills}
              aria-label={t('skills')}
            >
              {skills.map((skill, index) => (
                <li
                  className={styles.tag}
                  data-testid="team-skill"
                  key={index}
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : null}
          {onCall ? <span className={`${styles.tag} ${styles.onCall}`}>{t('onCall')}</span> : null}
        </div>
      ) : null}
    </article>
  );
};

export const SwissTeam = (props: TeamProps) => {
  const t = useTranslations('team');
  const section = teamSection(props);

  if (!section) {
    return null;
  }

  return (
    <section
      className={styles.team}
      data-testid="team"
      id="team"
      aria-labelledby="team-heading"
    >
      <div className={styles.head}>
        <div className={styles.aside}>
          <span
            className={styles.index}
            aria-hidden="true"
          />
          <span className={styles.mark}>{t('kicker')}</span>
        </div>
        <div className={styles.titleColumn}>
          <h2
            className={styles.heading}
            id="team-heading"
          >
            {t('heading')}
          </h2>
          <p className={styles.note}>{t('experience', { years: section.years })}</p>
        </div>
      </div>

      <div className={styles.body}>
        {section.core.length > 0 ? (
          <div className={styles.column}>
            {section.core.map((card, index) => (
              <SwissTeamCard
                key={index}
                card={card}
              />
            ))}
          </div>
        ) : null}

        <div className={styles.column}>
          {section.networkRoles ? (
            <article
              className={`${styles.member} ${styles.network}`}
              data-testid="team-network"
            >
              <span className={styles.kicker}>{t('networkKicker')}</span>
              <h3 className={styles.name}>{t('networkTitle')}</h3>
              <p className={styles.about}>{t('networkText')}</p>
              <ul className={styles.tags}>
                {section.networkRoles.map((role) => (
                  <li
                    className={styles.tag}
                    key={role}
                  >
                    {t(`roles.${role}`)}
                  </li>
                ))}
              </ul>
            </article>
          ) : (
            section.network.map((card, index) => (
              <SwissTeamCard
                key={index}
                card={card}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};
