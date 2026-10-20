import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "expenses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"utm_source" varchar NOT NULL,
  	"amount" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "expenses_id" integer;
  CREATE INDEX "expenses_updated_at_idx" ON "expenses" USING btree ("updated_at");
  CREATE INDEX "expenses_created_at_idx" ON "expenses" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_expenses_fk" FOREIGN KEY ("expenses_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_expenses_id_idx" ON "payload_locked_documents_rels" USING btree ("expenses_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_expenses_fk";
  DROP INDEX "payload_locked_documents_rels_expenses_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "expenses_id";
  ALTER TABLE "expenses" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "expenses" CASCADE;`)
}
