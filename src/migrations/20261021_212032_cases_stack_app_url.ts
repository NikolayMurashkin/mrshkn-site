import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "cases_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_cases_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "cases" ADD COLUMN "app_url" varchar;
  ALTER TABLE "_cases_v" ADD COLUMN "version_app_url" varchar;
  ALTER TABLE "cases_texts" ADD CONSTRAINT "cases_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_texts" ADD CONSTRAINT "_cases_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cases_texts_order_parent" ON "cases_texts" USING btree ("order","parent_id");
  CREATE INDEX "_cases_v_texts_order_parent" ON "_cases_v_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cases_texts" CASCADE;
  DROP TABLE "_cases_v_texts" CASCADE;
  ALTER TABLE "cases" DROP COLUMN "app_url";
  ALTER TABLE "_cases_v" DROP COLUMN "version_app_url";`)
}
