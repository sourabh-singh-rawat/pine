ALTER TABLE "identities" ADD COLUMN "identity_id" uuid;--> statement-breakpoint
UPDATE "identities" SET "identity_id" = "id" WHERE "identity_id" IS NULL;--> statement-breakpoint
ALTER TABLE "identities" ALTER COLUMN "identity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "identities" ADD COLUMN "full_name" varchar(255);--> statement-breakpoint
ALTER TABLE "identities" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "identities" ADD COLUMN "middle_name" text;--> statement-breakpoint
ALTER TABLE "identities" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "identities" ADD CONSTRAINT "identities_identity_id_unique" UNIQUE("identity_id");