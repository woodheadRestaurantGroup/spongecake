import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_suggestions_status" AS ENUM('open', 'resolved', 'dismissed');
  CREATE TABLE "suggestions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer,
  	"recipe_id" integer NOT NULL,
  	"submitted_by_id" integer NOT NULL,
  	"body" varchar NOT NULL,
  	"status" "enum_suggestions_status" DEFAULT 'open' NOT NULL,
  	"resolved_by_id" integer,
  	"resolved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "tags" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "recipes" ADD COLUMN "last_edited_by_id" integer;
  ALTER TABLE "_recipes_v" ADD COLUMN "version_last_edited_by_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "suggestions_id" integer;
  ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "suggestions_site_idx" ON "suggestions" USING btree ("site_id");
  CREATE INDEX "suggestions_recipe_idx" ON "suggestions" USING btree ("recipe_id");
  CREATE INDEX "suggestions_submitted_by_idx" ON "suggestions" USING btree ("submitted_by_id");
  CREATE INDEX "suggestions_resolved_by_idx" ON "suggestions" USING btree ("resolved_by_id");
  CREATE INDEX "suggestions_updated_at_idx" ON "suggestions" USING btree ("updated_at");
  CREATE INDEX "suggestions_created_at_idx" ON "suggestions" USING btree ("created_at");
  ALTER TABLE "recipes" ADD CONSTRAINT "recipes_last_edited_by_id_users_id_fk" FOREIGN KEY ("last_edited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recipes_v" ADD CONSTRAINT "_recipes_v_version_last_edited_by_id_users_id_fk" FOREIGN KEY ("version_last_edited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_suggestions_fk" FOREIGN KEY ("suggestions_id") REFERENCES "public"."suggestions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "recipes_last_edited_by_idx" ON "recipes" USING btree ("last_edited_by_id");
  CREATE INDEX "_recipes_v_version_version_last_edited_by_idx" ON "_recipes_v" USING btree ("version_last_edited_by_id");
  CREATE INDEX "payload_locked_documents_rels_suggestions_id_idx" ON "payload_locked_documents_rels" USING btree ("suggestions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "suggestions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "suggestions" CASCADE;
  ALTER TABLE "recipes" DROP CONSTRAINT "recipes_last_edited_by_id_users_id_fk";
  
  ALTER TABLE "_recipes_v" DROP CONSTRAINT "_recipes_v_version_last_edited_by_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_suggestions_fk";
  
  DROP INDEX "recipes_last_edited_by_idx";
  DROP INDEX "_recipes_v_version_version_last_edited_by_idx";
  DROP INDEX "payload_locked_documents_rels_suggestions_id_idx";
  ALTER TABLE "tags" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "recipes" DROP COLUMN "last_edited_by_id";
  ALTER TABLE "_recipes_v" DROP COLUMN "version_last_edited_by_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "suggestions_id";
  DROP TYPE "public"."enum_suggestions_status";`)
}
