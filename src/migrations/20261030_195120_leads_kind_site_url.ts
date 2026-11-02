import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_leads_kind" AS ENUM('brief', 'audit');
  ALTER TABLE "leads" ADD COLUMN "site_url" varchar;
  ALTER TABLE "leads" ADD COLUMN "kind" "enum_leads_kind" DEFAULT 'brief' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads" DROP COLUMN "site_url";
  ALTER TABLE "leads" DROP COLUMN "kind";
  DROP TYPE "public"."enum_leads_kind";`)
}
