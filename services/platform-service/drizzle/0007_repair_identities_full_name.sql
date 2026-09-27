DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'identities'
      AND column_name = 'display_name'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'identities'
      AND column_name = 'full_name'
  ) THEN
    ALTER TABLE "identities" RENAME COLUMN "display_name" TO "full_name";
  END IF;
END $$;
