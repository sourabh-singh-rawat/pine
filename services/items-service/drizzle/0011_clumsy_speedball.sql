ALTER TABLE "item_attachments" ALTER COLUMN "attachment_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "item_attachments" ADD COLUMN "status" text DEFAULT 'READY' NOT NULL;