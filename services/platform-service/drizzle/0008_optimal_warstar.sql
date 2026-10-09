CREATE TABLE "organization_levels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"rank" integer NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "organization_levels_tenant_id_slug_unique" UNIQUE("tenant_id","slug"),
	CONSTRAINT "organization_levels_tenant_id_name_unique" UNIQUE("tenant_id","name"),
	CONSTRAINT "organization_levels_tenant_id_rank_unique" UNIQUE("tenant_id","rank")
);
--> statement-breakpoint
CREATE TABLE "organization_office_types" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"level_id" uuid NOT NULL,
	"parent_office_type_id" uuid,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "organization_office_types_tenant_id_slug_unique" UNIQUE("tenant_id","slug"),
	CONSTRAINT "organization_office_types_tenant_id_name_unique" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
ALTER TABLE "identity_workspace_preferences" RENAME TO "identity_organization_preferences";--> statement-breakpoint
ALTER TABLE "workspaces" RENAME TO "organizations";--> statement-breakpoint
ALTER TABLE "identity_organization_preferences" RENAME COLUMN "workspace_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "organizations" RENAME COLUMN "parent_workspace_id" TO "parent_organization_id";--> statement-breakpoint
ALTER TABLE "identity_organization_preferences" DROP CONSTRAINT "identity_workspace_preferences_identity_id_unique";--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "workspaces_tenant_id_slug_unique";--> statement-breakpoint
ALTER TABLE "identity_organization_preferences" DROP CONSTRAINT "identity_workspace_preferences_identity_id_identities_id_fk";
--> statement-breakpoint
ALTER TABLE "identity_organization_preferences" DROP CONSTRAINT "identity_workspace_preferences_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "identity_organization_preferences" DROP CONSTRAINT "identity_workspace_preferences_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "workspaces_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "workspaces_parent_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "office_type_id" uuid;--> statement-breakpoint
INSERT INTO "organization_levels" ("id", "tenant_id", "name", "slug", "rank")
SELECT md5(t."id"::text || ':personal-level')::uuid, t."id", 'Personal', 'personal', 1
FROM "tenants" t
WHERE EXISTS (
	SELECT 1 FROM "organizations" o WHERE o."tenant_id" = t."id" AND o."office_type_id" IS NULL
);--> statement-breakpoint
INSERT INTO "organization_office_types" ("id", "tenant_id", "level_id", "name", "slug")
SELECT md5(l."id"::text || ':personal-type')::uuid, l."tenant_id", l."id", 'Personal', 'personal'
FROM "organization_levels" l
WHERE l."slug" = 'personal'
AND NOT EXISTS (
	SELECT 1 FROM "organization_office_types" ot
	WHERE ot."tenant_id" = l."tenant_id" AND ot."slug" = 'personal'
);--> statement-breakpoint
UPDATE "organizations" o
SET "office_type_id" = ot."id"
FROM "organization_office_types" ot
WHERE o."office_type_id" IS NULL
AND ot."tenant_id" = o."tenant_id"
AND ot."slug" = 'personal';--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "office_type_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_levels" ADD CONSTRAINT "organization_levels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_office_types" ADD CONSTRAINT "organization_office_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_office_types" ADD CONSTRAINT "organization_office_types_level_id_organization_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."organization_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_office_types" ADD CONSTRAINT "organization_office_types_parent_office_type_id_organization_office_types_id_fk" FOREIGN KEY ("parent_office_type_id") REFERENCES "public"."organization_office_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_organization_preferences" ADD CONSTRAINT "identity_organization_preferences_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_organization_preferences" ADD CONSTRAINT "identity_organization_preferences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_organization_preferences" ADD CONSTRAINT "identity_organization_preferences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_organization_id_organizations_id_fk" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_office_type_id_organization_office_types_id_fk" FOREIGN KEY ("office_type_id") REFERENCES "public"."organization_office_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_organization_preferences" ADD CONSTRAINT "identity_organization_preferences_identity_id_unique" UNIQUE("identity_id");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_slug_unique" UNIQUE("tenant_id","slug");