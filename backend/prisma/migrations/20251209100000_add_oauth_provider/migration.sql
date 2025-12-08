-- Add AuthProvider enum
DO $$ BEGIN
  CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add columns to User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN IF NOT EXISTS "providerId" TEXT;

-- Add unique index for providerId (nullable unique)
DO $$ BEGIN
  CREATE UNIQUE INDEX "User_providerId_key" ON "User"("providerId");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;
