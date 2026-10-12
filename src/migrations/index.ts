import * as migration_20260926_194520_initial from './20260926_194520_initial';
import * as migration_20261001_192428_cases_detail from './20261001_192428_cases_detail';
import * as migration_20261010_103414_cover_caption from './20261010_103414_cover_caption';
import * as migration_20261012_084456_team_skills from './20261012_084456_team_skills';

export const migrations = [
  {
    up: migration_20260926_194520_initial.up,
    down: migration_20260926_194520_initial.down,
    name: '20260926_194520_initial',
  },
  {
    up: migration_20261001_192428_cases_detail.up,
    down: migration_20261001_192428_cases_detail.down,
    name: '20261001_192428_cases_detail',
  },
  {
    up: migration_20261010_103414_cover_caption.up,
    down: migration_20261010_103414_cover_caption.down,
    name: '20261010_103414_cover_caption',
  },
  {
    up: migration_20261012_084456_team_skills.up,
    down: migration_20261012_084456_team_skills.down,
    name: '20261012_084456_team_skills'
  },
];
