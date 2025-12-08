-- Add LearningTopic table and link to Question

CREATE TABLE IF NOT EXISTS "LearningTopic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearningTopic_pkey" PRIMARY KEY ("id")
);

-- Unique name per grade
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'LearningTopic_name_gradeLevel_key') THEN
        CREATE UNIQUE INDEX "LearningTopic_name_gradeLevel_key" ON "LearningTopic"("name", "gradeLevel");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'LearningTopic_gradeLevel_idx') THEN
        CREATE INDEX "LearningTopic_gradeLevel_idx" ON "LearningTopic"("gradeLevel");
    END IF;
END $$;

-- Add column learningTopicId to Question if missing
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "learningTopicId" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Question_learningTopicId_idx') THEN
        CREATE INDEX "Question_learningTopicId_idx" ON "Question"("learningTopicId");
    END IF;
END $$;

-- Add FK to LearningTopic
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Question_learningTopicId_fkey'
    ) THEN
        ALTER TABLE "Question"
        ADD CONSTRAINT "Question_learningTopicId_fkey"
        FOREIGN KEY ("learningTopicId") REFERENCES "LearningTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
