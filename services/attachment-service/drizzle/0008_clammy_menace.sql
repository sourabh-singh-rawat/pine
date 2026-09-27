CREATE TABLE "attachment_metadatas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"attachment_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"width" integer,
	"height" integer,
	"format" text,
	"space" text,
	"channels" integer,
	"density" integer,
	"has_alpha" boolean,
	"orientation" integer,
	"extracted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachment_metadatas" ADD CONSTRAINT "attachment_metadatas_attachment_id_attachments_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment_metadatas" ADD CONSTRAINT "attachment_metadatas_version_id_attachment_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."attachment_versions"("id") ON DELETE no action ON UPDATE no action;