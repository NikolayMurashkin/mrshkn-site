import config from '@payload-config';
import { getPayload } from 'payload';
import type { Team } from '../payload-types';
import type { SiteLocale } from '../i18n/types';
import { toImage } from './image';
import type { TeamMember } from './types';

const toMember = ({ name, role, yearsSince, about, skills, photo }: Team): TeamMember => ({
  name,
  role,
  yearsSince,
  about: about?.trim() || null,
  skills: (skills ?? []).filter((skill) => skill.trim() !== ''),
  photo: toImage(photo),
});

/**
 * Команда для секции на главной: ядро студии и сеть подрядчиков, каждая часть — в том порядке, в каком людей
 * завели в админке. Кеша нет, как у кейсов: правка в админке видна со следующей загрузки.
 */
export const getTeam = async (locale: SiteLocale): Promise<{ core: TeamMember[]; network: TeamMember[] }> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'team',
    locale,
    depth: 1,
    pagination: false,
    sort: ['createdAt', 'id'],
    overrideAccess: false,
  });

  return {
    core: docs.filter((doc) => doc.core).map(toMember),
    network: docs.filter((doc) => !doc.core).map(toMember),
  };
};
