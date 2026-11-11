import { unknown, z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().max(30).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

const deleteSchema = z
  .object({
    confirm: z.string().trim().email(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

async function customerOr404(id: string) {
  return db.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      accountStatus: true,
      _count: {
        select: {
          bookings: true,
          reviews: true,
          quotesCreated: true,
          assignmentsReceived: true,
          assignmentsCreated: true,
          assignmentsUnassigned: true,
        },
      },
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;
    const parsed = updateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        "Please check the customer details.",
        { errors: parsed.error.flatten().fieldErrors }
      );
    }

    const existing = await customerOr404(id);
    if (!existing) {
      return apiError(404, "CUSTOMER_NOT_FOUND", "Customer not found.");
    }

    const customer = await db.$transaction(async (tx: any) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone?.trim() || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          accountStatus: true,
        },
      });

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "CUSTOMER_UPDATED",
        entityType: "USER",
        entityId: id,
        reason: parsed.data.reason,
        changes: {
          before: { name: existing.name, phone: existing.phone },
          after: { name: updated.name, phone: updated.phone },
        },
      });

      return updated;
    });

    return apiSuccess("Customer information has been saved.", { customer });
  } catch (error) {
    console.error("Update customer error:", error);
    return apiError(500, "CUSTOMER_UPDATE_FAILED", "Unable to update this customer.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;
    const parsed = deleteSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        "Type the customer's email address to confirm deletion."
      );
    }

    const existing = await customerOr404(id);
    if (!existing) {
      return apiError(404, "CUSTOMER_NOT_FOUND", "Customer not found.");
    }

    if (parsed.data.confirm.toLowerCase() !== existing.email.toLowerCase()) {
      return apiError(
        422,
        "CONFIRMATION_MISMATCH",
        "The confirmation text does not match the customer email."
      );
    }

    const protectedCount = Object.values(existing._count).reduce(
      (total, count) => (total as number) + (count as number),
      0
    );

    if (protectedCount as number > 0) {
      return apiError(
        409,
        "CUSTOMER_HAS_HISTORY",
        "This customer has bookings or other business records. Suspend the account instead of deleting it."
      );
    }

    await db.$transaction(async (tx: any) => {
      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "CUSTOMER_DELETED",
        entityType: "USER",
        entityId: id,
        reason: parsed.data.reason,
        changes: { before: { email: existing.email } },
      });
      await tx.passwordResetToken.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    return apiSuccess("The customer account was permanently removed.", {
      customerId: id,
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    return apiError(
      500,
      "CUSTOMER_DELETE_FAILED",
      "Unable to delete this customer."
    );
  }
}
