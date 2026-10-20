import type { JobsConfig } from 'payload';
import { Cases } from './collections/Cases';
import { Leads } from './collections/Leads';
import { Media } from './collections/Media';
import { Posts } from './collections/Posts';
import { Reviews } from './collections/Reviews';
import { Users } from './collections/Users';
import { CRM_QUEUE, CRM_QUEUE_CRON, CRM_QUEUE_SILENT } from './consts';
import { Settings } from './globals/Settings';
import { LeadReminders } from './reminders';

export const COLLECTIONS = [Users, Media, Cases, Posts, Reviews, Leads];

export const GLOBALS = [Settings];

/**
 * Очередь задач CRM крутится внутри приложения: расписание задач ставит их в очередь, `autoRun` прогоняет ее.
 * Оба идут, только если Payload поднят с `cron: true` — это делает `src/instrumentation.ts` при старте процесса.
 * Удачные задания удаляются, упавшие остаются в `payload-jobs` для разбора.
 */
export const JOBS: JobsConfig = {
  tasks: [LeadReminders],
  autoRun: [{ queue: CRM_QUEUE, cron: CRM_QUEUE_CRON, silent: CRM_QUEUE_SILENT }],
  deleteJobOnComplete: true,
};
