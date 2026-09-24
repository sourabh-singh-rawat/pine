CREATE TABLE "checklist_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"checklist_id" uuid NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"order_index" integer NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklists" (
	"id" uuid PRIMARY KEY NOT NULL,
	"item_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
