ALTER TABLE "item_activities" RENAME COLUMN "project_id" TO "list_id";--> statement-breakpoint
ALTER TABLE "list_item_activities" RENAME COLUMN "project_id" TO "list_id";--> statement-breakpoint
ALTER TABLE "status_options" RENAME COLUMN "project_id" TO "list_id";