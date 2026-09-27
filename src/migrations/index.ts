import * as migration_20260926_194520_initial from './20260926_194520_initial';

export const migrations = [
  {
    up: migration_20260926_194520_initial.up,
    down: migration_20260926_194520_initial.down,
    name: '20260926_194520_initial'
  },
];
