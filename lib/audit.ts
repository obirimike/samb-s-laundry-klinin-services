import type { Prisma, PrismaClient } from "@prisma/client";

type AuditClient = Prisma.TransactionClient | PrismaClient;

export type AuditEntry = {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  changes?: Prisma.InputJsonValue;
};

export async function writeAudit(client: AuditClient, entry: AuditEntry) {
  await client.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      reason: entry.reason?.trim() || null,
      changes: entry.changes,
    },
  });
}
