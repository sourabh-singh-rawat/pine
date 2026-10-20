ALTER TABLE "attachment_uploads" DROP CONSTRAINT "attachment_uploads_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "attachment_uploads" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "attachments" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tenants" CASCADE;