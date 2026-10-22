import * as migration_20260926_194520_initial from './20260926_194520_initial';
import * as migration_20261001_192428_cases_detail from './20261001_192428_cases_detail';
import * as migration_20261010_103414_cover_caption from './20261010_103414_cover_caption';
import * as migration_20261012_084456_team_skills from './20261012_084456_team_skills';
import * as migration_20261012_133715_remove_team from './20261012_133715_remove_team';
import * as migration_20261013_164210_reviews from './20261013_164210_reviews';
import * as migration_20261020_100951_leads from './20261020_100951_leads';
import * as migration_20261020_145625_crm_reminders from './20261020_145625_crm_reminders';
import * as migration_20261020_173744_expenses from './20261020_173744_expenses';
import * as migration_20261021_212032_cases_stack_app_url from './20261021_212032_cases_stack_app_url';

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
    name: '20261012_084456_team_skills',
  },
  {
    up: migration_20261012_133715_remove_team.up,
    down: migration_20261012_133715_remove_team.down,
    name: '20261012_133715_remove_team',
  },
  {
    up: migration_20261013_164210_reviews.up,
    down: migration_20261013_164210_reviews.down,
    name: '20261013_164210_reviews',
  },
  {
    up: migration_20261020_100951_leads.up,
    down: migration_20261020_100951_leads.down,
    name: '20261020_100951_leads',
  },
  {
    up: migration_20261020_145625_crm_reminders.up,
    down: migration_20261020_145625_crm_reminders.down,
    name: '20261020_145625_crm_reminders',
  },
  {
    up: migration_20261020_173744_expenses.up,
    down: migration_20261020_173744_expenses.down,
    name: '20261020_173744_expenses',
  },
  {
    up: migration_20261021_212032_cases_stack_app_url.up,
    down: migration_20261021_212032_cases_stack_app_url.down,
    name: '20261021_212032_cases_stack_app_url'
  },
];
