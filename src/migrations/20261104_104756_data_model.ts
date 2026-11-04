import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_recipes_ingredient_sections_ingredients_unit" AS ENUM('g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'each', 'pinch', 'bunch', 'sheet', 'none', 'other');
  CREATE TYPE "public"."enum_recipes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__recipes_v_version_ingredient_sections_ingredients_unit" AS ENUM('g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'each', 'pinch', 'bunch', 'sheet', 'none', 'other');
  CREATE TYPE "public"."enum__recipes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_users_memberships_role" AS ENUM('viewer', 'editor', 'siteAdmin');
  CREATE TABLE "recipes_ingredient_sections_ingredients" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quantity" numeric,
  	"unit" "enum_recipes_ingredient_sections_ingredients_unit" DEFAULT 'g',
  	"unit_label" varchar,
  	"item" varchar,
  	"sub_recipe_id" integer,
  	"note" varchar,
  	"scales" boolean DEFAULT true
  );
  
  CREATE TABLE "recipes_ingredient_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "recipes_method" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" jsonb,
  	"image_id" integer
  );
  
  CREATE TABLE "recipes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer,
  	"title" varchar,
  	"slug" varchar,
  	"author_id" integer,
  	"archived" boolean DEFAULT false,
  	"change_note" varchar,
  	"hero_image_id" integer,
  	"yield_amount" numeric DEFAULT 1,
  	"yield_label" varchar DEFAULT 'portions',
  	"notes" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_recipes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "recipes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "_recipes_v_version_ingredient_sections_ingredients" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"quantity" numeric,
  	"unit" "enum__recipes_v_version_ingredient_sections_ingredients_unit" DEFAULT 'g',
  	"unit_label" varchar,
  	"item" varchar,
  	"sub_recipe_id" integer,
  	"note" varchar,
  	"scales" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_recipes_v_version_ingredient_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_recipes_v_version_method" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" jsonb,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_recipes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_site_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_author_id" integer,
  	"version_archived" boolean DEFAULT false,
  	"version_change_note" varchar,
  	"version_hero_image_id" integer,
  	"version_yield_amount" numeric DEFAULT 1,
  	"version_yield_label" varchar DEFAULT 'portions',
  	"version_notes" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__recipes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_recipes_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_memberships" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"role" "enum_users_memberships_role" DEFAULT 'viewer' NOT NULL
  );
  
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"recipes_id" integer
  );
  
  CREATE TABLE "sites_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hostname" varchar NOT NULL
  );
  
  CREATE TABLE "sites" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"logo_id" integer,
  	"accent_colour" varchar DEFAULT '#b45309',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sites_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "login_tokens" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"email" varchar NOT NULL,
  	"token_hash" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"used_at" timestamp(3) with time zone,
  	"attempts" numeric DEFAULT 0,
  	"request_ip" varchar,
  	"redirect_to" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "is_group_admin" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "avatar_seed" varchar;
  ALTER TABLE "media" ADD COLUMN "site_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "recipes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sites_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "login_tokens_id" integer;
  ALTER TABLE "recipes_ingredient_sections_ingredients" ADD CONSTRAINT "recipes_ingredient_sections_ingredients_sub_recipe_id_recipes_id_fk" FOREIGN KEY ("sub_recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recipes_ingredient_sections_ingredients" ADD CONSTRAINT "recipes_ingredient_sections_ingredients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."recipes_ingredient_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recipes_ingredient_sections" ADD CONSTRAINT "recipes_ingredient_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recipes_method" ADD CONSTRAINT "recipes_method_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recipes_method" ADD CONSTRAINT "recipes_method_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recipes" ADD CONSTRAINT "recipes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recipes" ADD CONSTRAINT "recipes_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recipes_rels" ADD CONSTRAINT "recipes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recipes_rels" ADD CONSTRAINT "recipes_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_recipes_v_version_ingredient_sections_ingredients" ADD CONSTRAINT "_recipes_v_version_ingredient_sections_ingredients_sub_recipe_id_recipes_id_fk" FOREIGN KEY ("sub_recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recipes_v_version_ingredient_sections_ingredients" ADD CONSTRAINT "_recipes_v_version_ingredient_sections_ingredients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_recipes_v_version_ingredient_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_recipes_v_version_ingredient_sections" ADD CONSTRAINT "_recipes_v_version_ingredient_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_recipes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_recipes_v_version_method" ADD CONSTRAINT "_recipes_v_version_method_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recipes_v_version_method" ADD CONSTRAINT "_recipes_v_version_method_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_recipes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_recipes_v" ADD CONSTRAINT "_recipes_v_parent_id_recipes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recipes_v" ADD CONSTRAINT "_recipes_v_version_site_id_sites_id_fk" FOREIGN KEY ("version_site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recipes_v" ADD CONSTRAINT "_recipes_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recipes_v" ADD CONSTRAINT "_recipes_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recipes_v_rels" ADD CONSTRAINT "_recipes_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_recipes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_recipes_v_rels" ADD CONSTRAINT "_recipes_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags" ADD CONSTRAINT "tags_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_memberships" ADD CONSTRAINT "users_memberships_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_memberships" ADD CONSTRAINT "users_memberships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_recipes_fk" FOREIGN KEY ("recipes_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sites_domains" ADD CONSTRAINT "sites_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sites" ADD CONSTRAINT "sites_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sites_rels" ADD CONSTRAINT "sites_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sites_rels" ADD CONSTRAINT "sites_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "login_tokens" ADD CONSTRAINT "login_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "recipes_ingredient_sections_ingredients_order_idx" ON "recipes_ingredient_sections_ingredients" USING btree ("_order");
  CREATE INDEX "recipes_ingredient_sections_ingredients_parent_id_idx" ON "recipes_ingredient_sections_ingredients" USING btree ("_parent_id");
  CREATE INDEX "recipes_ingredient_sections_ingredients_sub_recipe_idx" ON "recipes_ingredient_sections_ingredients" USING btree ("sub_recipe_id");
  CREATE INDEX "recipes_ingredient_sections_order_idx" ON "recipes_ingredient_sections" USING btree ("_order");
  CREATE INDEX "recipes_ingredient_sections_parent_id_idx" ON "recipes_ingredient_sections" USING btree ("_parent_id");
  CREATE INDEX "recipes_method_order_idx" ON "recipes_method" USING btree ("_order");
  CREATE INDEX "recipes_method_parent_id_idx" ON "recipes_method" USING btree ("_parent_id");
  CREATE INDEX "recipes_method_image_idx" ON "recipes_method" USING btree ("image_id");
  CREATE INDEX "recipes_site_idx" ON "recipes" USING btree ("site_id");
  CREATE INDEX "recipes_slug_idx" ON "recipes" USING btree ("slug");
  CREATE INDEX "recipes_author_idx" ON "recipes" USING btree ("author_id");
  CREATE INDEX "recipes_hero_image_idx" ON "recipes" USING btree ("hero_image_id");
  CREATE INDEX "recipes_updated_at_idx" ON "recipes" USING btree ("updated_at");
  CREATE INDEX "recipes_created_at_idx" ON "recipes" USING btree ("created_at");
  CREATE INDEX "recipes__status_idx" ON "recipes" USING btree ("_status");
  CREATE INDEX "recipes_rels_order_idx" ON "recipes_rels" USING btree ("order");
  CREATE INDEX "recipes_rels_parent_idx" ON "recipes_rels" USING btree ("parent_id");
  CREATE INDEX "recipes_rels_path_idx" ON "recipes_rels" USING btree ("path");
  CREATE INDEX "recipes_rels_tags_id_idx" ON "recipes_rels" USING btree ("tags_id");
  CREATE INDEX "_recipes_v_version_ingredient_sections_ingredients_order_idx" ON "_recipes_v_version_ingredient_sections_ingredients" USING btree ("_order");
  CREATE INDEX "_recipes_v_version_ingredient_sections_ingredients_parent_id_idx" ON "_recipes_v_version_ingredient_sections_ingredients" USING btree ("_parent_id");
  CREATE INDEX "_recipes_v_version_ingredient_sections_ingredients_sub_r_idx" ON "_recipes_v_version_ingredient_sections_ingredients" USING btree ("sub_recipe_id");
  CREATE INDEX "_recipes_v_version_ingredient_sections_order_idx" ON "_recipes_v_version_ingredient_sections" USING btree ("_order");
  CREATE INDEX "_recipes_v_version_ingredient_sections_parent_id_idx" ON "_recipes_v_version_ingredient_sections" USING btree ("_parent_id");
  CREATE INDEX "_recipes_v_version_method_order_idx" ON "_recipes_v_version_method" USING btree ("_order");
  CREATE INDEX "_recipes_v_version_method_parent_id_idx" ON "_recipes_v_version_method" USING btree ("_parent_id");
  CREATE INDEX "_recipes_v_version_method_image_idx" ON "_recipes_v_version_method" USING btree ("image_id");
  CREATE INDEX "_recipes_v_parent_idx" ON "_recipes_v" USING btree ("parent_id");
  CREATE INDEX "_recipes_v_version_version_site_idx" ON "_recipes_v" USING btree ("version_site_id");
  CREATE INDEX "_recipes_v_version_version_slug_idx" ON "_recipes_v" USING btree ("version_slug");
  CREATE INDEX "_recipes_v_version_version_author_idx" ON "_recipes_v" USING btree ("version_author_id");
  CREATE INDEX "_recipes_v_version_version_hero_image_idx" ON "_recipes_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_recipes_v_version_version_updated_at_idx" ON "_recipes_v" USING btree ("version_updated_at");
  CREATE INDEX "_recipes_v_version_version_created_at_idx" ON "_recipes_v" USING btree ("version_created_at");
  CREATE INDEX "_recipes_v_version_version__status_idx" ON "_recipes_v" USING btree ("version__status");
  CREATE INDEX "_recipes_v_created_at_idx" ON "_recipes_v" USING btree ("created_at");
  CREATE INDEX "_recipes_v_updated_at_idx" ON "_recipes_v" USING btree ("updated_at");
  CREATE INDEX "_recipes_v_latest_idx" ON "_recipes_v" USING btree ("latest");
  CREATE INDEX "_recipes_v_rels_order_idx" ON "_recipes_v_rels" USING btree ("order");
  CREATE INDEX "_recipes_v_rels_parent_idx" ON "_recipes_v_rels" USING btree ("parent_id");
  CREATE INDEX "_recipes_v_rels_path_idx" ON "_recipes_v_rels" USING btree ("path");
  CREATE INDEX "_recipes_v_rels_tags_id_idx" ON "_recipes_v_rels" USING btree ("tags_id");
  CREATE INDEX "tags_site_idx" ON "tags" USING btree ("site_id");
  CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "users_memberships_order_idx" ON "users_memberships" USING btree ("_order");
  CREATE INDEX "users_memberships_parent_id_idx" ON "users_memberships" USING btree ("_parent_id");
  CREATE INDEX "users_memberships_site_idx" ON "users_memberships" USING btree ("site_id");
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_recipes_id_idx" ON "users_rels" USING btree ("recipes_id");
  CREATE INDEX "sites_domains_order_idx" ON "sites_domains" USING btree ("_order");
  CREATE INDEX "sites_domains_parent_id_idx" ON "sites_domains" USING btree ("_parent_id");
  CREATE INDEX "sites_domains_hostname_idx" ON "sites_domains" USING btree ("hostname");
  CREATE UNIQUE INDEX "sites_slug_idx" ON "sites" USING btree ("slug");
  CREATE INDEX "sites_logo_idx" ON "sites" USING btree ("logo_id");
  CREATE INDEX "sites_updated_at_idx" ON "sites" USING btree ("updated_at");
  CREATE INDEX "sites_created_at_idx" ON "sites" USING btree ("created_at");
  CREATE INDEX "sites_rels_order_idx" ON "sites_rels" USING btree ("order");
  CREATE INDEX "sites_rels_parent_idx" ON "sites_rels" USING btree ("parent_id");
  CREATE INDEX "sites_rels_path_idx" ON "sites_rels" USING btree ("path");
  CREATE INDEX "sites_rels_tags_id_idx" ON "sites_rels" USING btree ("tags_id");
  CREATE INDEX "login_tokens_user_idx" ON "login_tokens" USING btree ("user_id");
  CREATE INDEX "login_tokens_email_idx" ON "login_tokens" USING btree ("email");
  CREATE UNIQUE INDEX "login_tokens_token_hash_idx" ON "login_tokens" USING btree ("token_hash");
  CREATE INDEX "login_tokens_updated_at_idx" ON "login_tokens" USING btree ("updated_at");
  CREATE INDEX "login_tokens_created_at_idx" ON "login_tokens" USING btree ("created_at");
  ALTER TABLE "media" ADD CONSTRAINT "media_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_recipes_fk" FOREIGN KEY ("recipes_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sites_fk" FOREIGN KEY ("sites_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_login_tokens_fk" FOREIGN KEY ("login_tokens_id") REFERENCES "public"."login_tokens"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_site_idx" ON "media" USING btree ("site_id");
  CREATE INDEX "payload_locked_documents_rels_recipes_id_idx" ON "payload_locked_documents_rels" USING btree ("recipes_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_sites_id_idx" ON "payload_locked_documents_rels" USING btree ("sites_id");
  CREATE INDEX "payload_locked_documents_rels_login_tokens_id_idx" ON "payload_locked_documents_rels" USING btree ("login_tokens_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "recipes_ingredient_sections_ingredients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "recipes_ingredient_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "recipes_method" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "recipes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "recipes_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_recipes_v_version_ingredient_sections_ingredients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_recipes_v_version_ingredient_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_recipes_v_version_method" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_recipes_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_recipes_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_memberships" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sites_domains" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sites" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sites_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "login_tokens" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "recipes_ingredient_sections_ingredients" CASCADE;
  DROP TABLE "recipes_ingredient_sections" CASCADE;
  DROP TABLE "recipes_method" CASCADE;
  DROP TABLE "recipes" CASCADE;
  DROP TABLE "recipes_rels" CASCADE;
  DROP TABLE "_recipes_v_version_ingredient_sections_ingredients" CASCADE;
  DROP TABLE "_recipes_v_version_ingredient_sections" CASCADE;
  DROP TABLE "_recipes_v_version_method" CASCADE;
  DROP TABLE "_recipes_v" CASCADE;
  DROP TABLE "_recipes_v_rels" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "users_memberships" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "sites_domains" CASCADE;
  DROP TABLE "sites" CASCADE;
  DROP TABLE "sites_rels" CASCADE;
  DROP TABLE "login_tokens" CASCADE;
  ALTER TABLE "media" DROP CONSTRAINT "media_site_id_sites_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_recipes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tags_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sites_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_login_tokens_fk";
  
  DROP INDEX "media_site_idx";
  DROP INDEX "payload_locked_documents_rels_recipes_id_idx";
  DROP INDEX "payload_locked_documents_rels_tags_id_idx";
  DROP INDEX "payload_locked_documents_rels_sites_id_idx";
  DROP INDEX "payload_locked_documents_rels_login_tokens_id_idx";
  ALTER TABLE "media" DROP COLUMN "site_id";
  ALTER TABLE "users" DROP COLUMN "is_group_admin";
  ALTER TABLE "users" DROP COLUMN "avatar_seed";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "recipes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sites_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "login_tokens_id";
  DROP TYPE "public"."enum_recipes_ingredient_sections_ingredients_unit";
  DROP TYPE "public"."enum_recipes_status";
  DROP TYPE "public"."enum__recipes_v_version_ingredient_sections_ingredients_unit";
  DROP TYPE "public"."enum__recipes_v_version_status";
  DROP TYPE "public"."enum_users_memberships_role";`)
}
