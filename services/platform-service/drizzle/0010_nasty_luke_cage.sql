CREATE TABLE "tenant_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"identity_id" uuid NOT NULL,
	"role" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "tenant_members_tenant_id_identity_id_unique" UNIQUE("tenant_id","identity_id")
);
--> statement-breakpoint
ALTER TABLE "organization_office_types" RENAME TO "organization_types";--> statement-breakpoint
ALTER TABLE "organization_types" RENAME COLUMN "parent_office_type_id" TO "parent_organization_type_id";--> statement-breakpoint
ALTER TABLE "organizations" RENAME COLUMN "office_type_id" TO "organization_type_id";--> statement-breakpoint
ALTER TABLE "organization_types" DROP CONSTRAINT "organization_office_types_tenant_id_slug_unique";--> statement-breakpoint
ALTER TABLE "organization_types" DROP CONSTRAINT "organization_office_types_tenant_id_name_unique";--> statement-breakpoint
ALTER TABLE "organization_types" DROP CONSTRAINT "organization_office_types_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "organization_types" DROP CONSTRAINT "organization_office_types_parent_office_type_id_organization_office_types_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_office_type_id_organization_office_types_id_fk";
--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_types" ADD CONSTRAINT "organization_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_types" ADD CONSTRAINT "organization_types_parent_organization_type_id_organization_types_id_fk" FOREIGN KEY ("parent_organization_type_id") REFERENCES "public"."organization_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_organization_type_id_organization_types_id_fk" FOREIGN KEY ("organization_type_id") REFERENCES "public"."organization_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_types" ADD CONSTRAINT "organization_types_tenant_id_slug_unique" UNIQUE("tenant_id","slug");--> statement-breakpoint
ALTER TABLE "organization_types" ADD CONSTRAINT "organization_types_tenant_id_name_unique" UNIQUE("tenant_id","name");