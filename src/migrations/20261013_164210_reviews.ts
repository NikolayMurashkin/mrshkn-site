import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_reviews_invite_locale" AS ENUM('ru', 'en');
  CREATE TYPE "public"."enum_reviews_status" AS ENUM('invited', 'received', 'published', 'rejected', 'withdrawn');
  CREATE TYPE "public"."enum_reviews_locale" AS ENUM('ru', 'en');
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"project" varchar NOT NULL,
  	"case_id" integer,
  	"email" varchar NOT NULL,
  	"invite_locale" "enum_reviews_invite_locale" DEFAULT 'ru' NOT NULL,
  	"status" "enum_reviews_status" DEFAULT 'invited' NOT NULL,
  	"code" varchar,
  	"sent_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"locale" "enum_reviews_locale",
  	"full_name" varchar,
  	"signature" varchar,
  	"occupation" varchar,
  	"link" varchar,
  	"answers_before" varchar,
  	"answers_process" varchar,
  	"answers_after" varchar,
  	"consent_text" varchar,
  	"license_text" varchar,
  	"consent_version" varchar,
  	"consent_at" timestamp(3) with time zone,
  	"restrictions_no_transfer" boolean,
  	"restrictions_no_link" boolean,
  	"restrictions_other" varchar,
  	"withdrawn_at" timestamp(3) with time zone,
  	"translation_text" varchar,
  	"translation_approved" boolean,
  	"translation_approved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "reviews_case_idx" ON "reviews" USING btree ("case_id");
  CREATE UNIQUE INDEX "reviews_code_idx" ON "reviews" USING btree ("code");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reviews_fk";
  DROP INDEX "payload_locked_documents_rels_reviews_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reviews_id";
  ALTER TABLE "reviews" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "reviews" CASCADE;
  DROP TYPE "public"."enum_reviews_invite_locale";
  DROP TYPE "public"."enum_reviews_status";
  DROP TYPE "public"."enum_reviews_locale";`)
}
