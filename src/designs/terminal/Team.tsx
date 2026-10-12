import { useTranslations } from 'next-intl';
import { TeamPortrait } from '@/components/TeamPortrait';
import { teamSection } from '../team';
import type { TeamProps } from '../types';
import type { TerminalTeamCardProps } from './types';
import styles from './Team.module.scss';

const TerminalTeamCard = ({ card }: TerminalTeamCardProps) => {
  const t = useTranslations('team');
  const { member, network, skills, onCall } = card;

  const body = (
    <div className={styles.body}>
      <TeamPortrait
        member={member}
        photoClassName={styles.photo}
      />
      <span className={styles.label}>{t(`roles.${member.role}`)}</span>
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
    </div>
  );

  return network ? (
    <article
      className={`${styles.member} ${styles.network}`}
      data-testid="team-member"
    >
      {body}
    </article>
  ) : (
    <article
      className={`${styles.member} ${styles.window}`}
      data-testid="team-member"
    >
      <div
        className={styles.bar}
        aria-hidden="true"
      >
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      {body}
    </article>
  );
};

export const TerminalTeam = (props: TeamProps) => {
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
        <h2
          className={styles.heading}
          id="team-heading"
        >
          {t('heading')}
        </h2>
        <p className={styles.note}>
          <span
            className={styles.prompt}
            aria-hidden="true"
          >
            {'//'}
          </span>{' '}
          {t('experience', { years: section.years })}
        </p>
      </div>

      <div className={styles.grid}>
        {section.core.length > 0 ? (
          <div className={styles.column}>
            {section.core.map((card, index) => (
              <TerminalTeamCard
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
              <div className={styles.body}>
                <span className={styles.label}>{t('networkKicker')}</span>
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
              </div>
            </article>
          ) : (
            section.network.map((card, index) => (
              <TerminalTeamCard
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
