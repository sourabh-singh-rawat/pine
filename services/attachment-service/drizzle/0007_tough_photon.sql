CREATE TABLE "attachment_derivatives" (
	"id" uuid PRIMARY KEY NOT NULL,
	"attachment_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"derivative_type" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"storage_provider" text NOT NULL,
	"storage_object_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachment_derivatives" ADD CONSTRAINT "attachment_derivatives_attachment_id_attachments_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment_derivatives" ADD CONSTRAINT "attachment_derivatives_version_id_attachment_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."attachment_versions"("id") ON DELETE no action ON UPDATE no action;