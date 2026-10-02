import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cases_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cases_v_version_kind" AS ENUM('demo', 'client');
  CREATE TYPE "public"."enum__cases_v_version_niche" AS ENUM('clinic', 'expert', 'horeca', 'startup', 'other');
  CREATE TYPE "public"."enum__cases_v_version_design" AS ENUM('kinetic', 'terminal', 'pop', 'swiss', 'editorial');
  CREATE TYPE "public"."enum__cases_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cases_v_published_locale" AS ENUM('ru', 'en');
  CREATE TABLE "cases_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cases_metrics_locales" (
  	"value" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_cases_v_version_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cases_v_version_metrics_locales" (
  	"value" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_cases_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_kind" "enum__cases_v_version_kind",
  	"version_niche" "enum__cases_v_version_niche",
  	"version_design" "enum__cases_v_version_design",
  	"version_demo_url" varchar,
  	"version_cover_id" integer,
  	"version_lighthouse_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__cases_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__cases_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_cases_v_locales" (
  	"version_title" varchar,
  	"version_task" varchar,
  	"version_solution" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "cases" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "cases" ALTER COLUMN "kind" DROP NOT NULL;
  ALTER TABLE "cases" ALTER COLUMN "niche" DROP NOT NULL;
  ALTER TABLE "cases" ALTER COLUMN "design" DROP NOT NULL;
  ALTER TABLE "cases_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "cases" ADD COLUMN "cover_id" integer;
  ALTER TABLE "cases" ADD COLUMN "lighthouse_id" integer;
  ALTER TABLE "cases" ADD COLUMN "_status" "enum_cases_status" DEFAULT 'draft';
  ALTER TABLE "cases_locales" ADD COLUMN "task" varchar;
  ALTER TABLE "cases_locales" ADD COLUMN "solution" varchar;
  ALTER TABLE "cases_metrics" ADD CONSTRAINT "cases_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_metrics_locales" ADD CONSTRAINT "cases_metrics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases_metrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_version_metrics" ADD CONSTRAINT "_cases_v_version_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_version_metrics_locales" ADD CONSTRAINT "_cases_v_version_metrics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v_version_metrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_parent_id_cases_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_version_lighthouse_id_media_id_fk" FOREIGN KEY ("version_lighthouse_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_locales" ADD CONSTRAINT "_cases_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cases_metrics_order_idx" ON "cases_metrics" USING btree ("_order");
  CREATE INDEX "cases_metrics_parent_id_idx" ON "cases_metrics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "cases_metrics_locales_locale_parent_id_unique" ON "cases_metrics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_cases_v_version_metrics_order_idx" ON "_cases_v_version_metrics" USING btree ("_order");
  CREATE INDEX "_cases_v_version_metrics_parent_id_idx" ON "_cases_v_version_metrics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_cases_v_version_metrics_locales_locale_parent_id_unique" ON "_cases_v_version_metrics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_cases_v_parent_idx" ON "_cases_v" USING btree ("parent_id");
  CREATE INDEX "_cases_v_version_version_slug_idx" ON "_cases_v" USING btree ("version_slug");
  CREATE INDEX "_cases_v_version_version_cover_idx" ON "_cases_v" USING btree ("version_cover_id");
  CREATE INDEX "_cases_v_version_version_lighthouse_idx" ON "_cases_v" USING btree ("version_lighthouse_id");
  CREATE INDEX "_cases_v_version_version_updated_at_idx" ON "_cases_v" USING btree ("version_updated_at");
  CREATE INDEX "_cases_v_version_version_created_at_idx" ON "_cases_v" USING btree ("version_created_at");
  CREATE INDEX "_cases_v_version_version__status_idx" ON "_cases_v" USING btree ("version__status");
  CREATE INDEX "_cases_v_created_at_idx" ON "_cases_v" USING btree ("created_at");
  CREATE INDEX "_cases_v_updated_at_idx" ON "_cases_v" USING btree ("updated_at");
  CREATE INDEX "_cases_v_snapshot_idx" ON "_cases_v" USING btree ("snapshot");
  CREATE INDEX "_cases_v_published_locale_idx" ON "_cases_v" USING btree ("published_locale");
  CREATE INDEX "_cases_v_latest_idx" ON "_cases_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_cases_v_locales_locale_parent_id_unique" ON "_cases_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "cases" ADD CONSTRAINT "cases_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_lighthouse_id_media_id_fk" FOREIGN KEY ("lighthouse_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "cases_cover_idx" ON "cases" USING btree ("cover_id");
  CREATE INDEX "cases_lighthouse_idx" ON "cases" USING btree ("lighthouse_id");
  CREATE INDEX "cases__status_idx" ON "cases" USING btree ("_status");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cases_metrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases_metrics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v_version_metrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v_version_metrics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cases_metrics" CASCADE;
  DROP TABLE "cases_metrics_locales" CASCADE;
  DROP TABLE "_cases_v_version_metrics" CASCADE;
  DROP TABLE "_cases_v_version_metrics_locales" CASCADE;
  DROP TABLE "_cases_v" CASCADE;
  DROP TABLE "_cases_v_locales" CASCADE;
  ALTER TABLE "cases" DROP CONSTRAINT "cases_cover_id_media_id_fk";
  
  ALTER TABLE "cases" DROP CONSTRAINT "cases_lighthouse_id_media_id_fk";
  
  DROP INDEX "cases_cover_idx";
  DROP INDEX "cases_lighthouse_idx";
  DROP INDEX "cases__status_idx";
  ALTER TABLE "cases" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "cases" ALTER COLUMN "kind" SET NOT NULL;
  ALTER TABLE "cases" ALTER COLUMN "niche" SET NOT NULL;
  ALTER TABLE "cases" ALTER COLUMN "design" SET NOT NULL;
  ALTER TABLE "cases_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "cases" DROP COLUMN "cover_id";
  ALTER TABLE "cases" DROP COLUMN "lighthouse_id";
  ALTER TABLE "cases" DROP COLUMN "_status";
  ALTER TABLE "cases_locales" DROP COLUMN "task";
  ALTER TABLE "cases_locales" DROP COLUMN "solution";
  DROP TYPE "public"."enum_cases_status";
  DROP TYPE "public"."enum__cases_v_version_kind";
  DROP TYPE "public"."enum__cases_v_version_niche";
  DROP TYPE "public"."enum__cases_v_version_design";
  DROP TYPE "public"."enum__cases_v_version_status";
  DROP TYPE "public"."enum__cases_v_published_locale";`)
}
