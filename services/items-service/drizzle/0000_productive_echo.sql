CREATE TABLE "check_list_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"description" text,
	"issue_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_activities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"issue_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_assignees" (
	"id" uuid PRIMARY KEY NOT NULL,
	"item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_attachments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"owner_id" text NOT NULL,
	"issue_id" text NOT NULL,
	"bucket_name" text,
	"path" text,
	"variant" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_comments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"issue_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"status_id" uuid NOT NULL,
	"priority" text NOT NULL,
	"list_id" uuid NOT NULL,
	"start_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"created_by_id" uuid NOT NULL,
	"updated_by_id" uuid,
	"parent_item_id" uuid,
	"estimate" integer,
	"component" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"event_type" varchar(255) NOT NULL,
	"event_version" integer NOT NULL,
	"aggregate_type" varchar(100) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'Pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"last_error" text,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "list_item_activities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"action" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_options" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"order_index" integer NOT NULL,
	"project_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_event_id_uidx" ON "outbox_messages" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "outbox_status_next_attempt_idx" ON "outbox_messages" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "outbox_aggregate_idx" ON "outbox_messages" USING btree ("aggregate_type","aggregate_id");