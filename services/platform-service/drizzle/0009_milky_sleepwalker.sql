ALTER TABLE "organization_office_types" DROP CONSTRAINT "organization_office_types_level_id_organization_levels_id_fk";--> statement-breakpoint
ALTER TABLE "organization_office_types" DROP COLUMN "level_id";--> statement-breakpoint
DROP TABLE "organization_levels";
