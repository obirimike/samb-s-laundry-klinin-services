import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";

export async function changeAccountStatus(input: {
  actorId: string;
  userId: string;
  role: "CUSTOMER" | "STAFF";
  status: "ACTIVE" | "SUSPENDED";
  reason?: string;
}) {
  const existing = await db.user.findFirst({
    where: { id: input.userId, role: input.role },
    select: {
      id: true,
      name: true,
      email: true,
      accountStatus: true,
    },
  });

  if (!existing) return { kind: "NOT_FOUND" as const };

  if (existing.accountStatus === input.status) {
    return { kind: "CONFLICT" as const, user: existing };
  }

  const action =
    input.role === "CUSTOMER"
      ? input.status === "SUSPENDED"
        ? "CUSTOMER_SUSPENDED"
        : "CUSTOMER_REACTIVATED"
      : input.status === "SUSPENDED"
        ? "STAFF_SUSPENDED"
        : "STAFF_REACTIVATED";

  const user = await db.$transaction(async (tx: any) => {
    const updated = await tx.user.update({
      where: { id: existing.id },
      data: {
        accountStatus: input.status,
        sessionVersion: { increment: 1 },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        accountStatus: true,
      },
    });

    await writeAudit(tx, {
      actorId: input.actorId,
      action,
      entityType: "USER",
      entityId: existing.id,
      reason: input.reason,
      changes: {
        before: { accountStatus: existing.accountStatus },
        after: { accountStatus: input.status },
      },
    });

    return updated;
  });

  return { kind: "SUCCESS" as const, user };
}
