-- Add AuthProvider enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthProvider') THEN
    CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');
  END IF;
END $$;

-- Add columns to User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN IF NOT EXISTS "providerId" TEXT;

-- Unique index on providerId (nullable)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'User_providerId_key') THEN
    CREATE UNIQUE INDEX "User_providerId_key" ON "User"("providerId");
  END IF;
END $$;
