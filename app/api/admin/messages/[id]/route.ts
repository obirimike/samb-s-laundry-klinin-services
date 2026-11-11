import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";

const updateSchema = z
  .object({
    status: z.enum(["NEW", "READ", "RESOLVED", "ARCHIVED"]),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(422, "VALIDATION_ERROR", "Invalid message status.");
    }

    const existing = await db.contactMessage.findUnique({ where: { id } });
    if (!existing) {
      return apiError(404, "MESSAGE_NOT_FOUND", "Message not found.");
    }

    const { status, reason } = parsed.data;

    const updated = await db.$transaction(async (tx: any) => {
      const msg = await tx.contactMessage.update({
        where: { id },
        data: { status },
      });

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: `MESSAGE_${status}`,
        entityType: "CONTACT_MESSAGE",
        entityId: id,
        reason,
        changes: {
          before: { status: existing.status },
          after: { status },
        },
      });

      return msg;
    });

    return apiSuccess(`Message marked as ${status.toLowerCase()}.`, { contactMessage: updated });
  } catch (error) {
    console.error("Update contact message error:", error);
    return apiError(500, "MESSAGE_UPDATE_FAILED", "Unable to update message.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;

    const existing = await db.contactMessage.findUnique({ where: { id } });
    if (!existing) {
      return apiError(404, "MESSAGE_NOT_FOUND", "Message not found.");
    }

    await db.$transaction(async (tx: any) => {
      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "MESSAGE_DELETED",
        entityType: "CONTACT_MESSAGE",
        entityId: id,
        changes: {
          subject: existing.subject,
          email: existing.email,
        },
      });

      await tx.contactMessage.delete({ where: { id } });
    });

    return apiSuccess("Message has been deleted.");
  } catch (error) {
    console.error("Delete contact message error:", error);
    return apiError(500, "MESSAGE_DELETE_FAILED", "Unable to delete message.");
  }
}

