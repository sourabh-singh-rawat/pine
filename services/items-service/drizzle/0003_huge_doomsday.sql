ALTER TABLE "issue_activities" RENAME TO "item_activities";--> statement-breakpoint
ALTER TABLE "issue_attachments" RENAME TO "item_attachments";--> statement-breakpoint
ALTER TABLE "issue_comments" RENAME TO "item_comments";--> statement-breakpoint
ALTER TABLE "check_list_items" RENAME COLUMN "issue_id" TO "item_id";--> statement-breakpoint
ALTER TABLE "item_activities" RENAME COLUMN "issue_id" TO "item_id";--> statement-breakpoint
ALTER TABLE "item_attachments" RENAME COLUMN "issue_id" TO "item_id";--> statement-breakpoint
ALTER TABLE "item_comments" RENAME COLUMN "issue_id" TO "item_id";