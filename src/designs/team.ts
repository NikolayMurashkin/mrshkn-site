import type { TeamMember } from '@/cms/types';
import { TEAM_NETWORK_ROLES } from '@/content/consts';
import { teamExperienceYears } from '@/lib/team';
import type { TeamCardData, TeamProps, TeamSectionData } from './types';

const toCard = (member: TeamMember, network: boolean): TeamCardData => ({
  member,
  network,
  skills: member.skills,
  onCall: !network,
});

/**
 * Что рисует секция «Команда» в любом направлении; разметка и стили остаются у направления. Людей нет — `null`,
 * секции нет. Сумма лет — по ядру и сети вместе.
 */
export const teamSection = ({ core, network }: TeamProps): TeamSectionData | null => {
  if (core.length === 0 && network.length === 0) {
    return null;
  }

  return {
    years: teamExperienceYears([...core, ...network]),
    core: core.map((member) => toCard(member, false)),
    network: network.map((member) => toCard(member, true)),
    networkRoles: network.length > 0 ? null : TEAM_NETWORK_ROLES,
  };
};
