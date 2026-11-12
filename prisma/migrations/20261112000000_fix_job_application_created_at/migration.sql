-- Safely restore the missing JobApplication.createdAt column.
-- Existing applications retain their original submission timestamp.

ALTER TABLE "JobApplication"
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

UPDATE "JobApplication"
SET "createdAt" = "submittedAt"
WHERE "createdAt" IS NULL;

ALTER TABLE "JobApplication"
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "JobApplication"
ALTER COLUMN "createdAt" SET NOT NULL;

-- Restore the missing index without duplicating an existing index.
CREATE INDEX IF NOT EXISTS "JobApplication_createdAt_idx"
ON "JobApplication"("createdAt");
