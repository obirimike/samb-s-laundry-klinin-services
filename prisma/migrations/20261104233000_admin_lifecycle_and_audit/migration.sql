-- Account suspension, service lifecycle, archived messages, and admin audit log.

CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

ALTER TABLE "User" ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");

CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

ALTER TABLE "Service" ADD COLUMN "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "Service" SET "status" = 'INACTIVE' WHERE "isActive" = false;

DROP INDEX "Service_isActive_idx";

ALTER TABLE "Service" DROP COLUMN "isActive";

CREATE INDEX "Service_status_idx" ON "Service"("status");

ALTER TYPE "ContactMessageStatus" ADD VALUE 'ARCHIVED';

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
