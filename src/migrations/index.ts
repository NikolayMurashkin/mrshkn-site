import * as migration_20260926_194520_initial from './20260926_194520_initial';
import * as migration_20261001_192428_cases_detail from './20261001_192428_cases_detail';

export const migrations = [
  {
    up: migration_20260926_194520_initial.up,
    down: migration_20260926_194520_initial.down,
    name: '20260926_194520_initial',
  },
  {
    up: migration_20261001_192428_cases_detail.up,
    down: migration_20261001_192428_cases_detail.down,
    name: '20261001_192428_cases_detail'
  },
];
