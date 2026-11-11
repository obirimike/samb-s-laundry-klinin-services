import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    category: z
      .enum(["CLEANING", "LAUNDRY", "DOMESTIC_SUPPORT", "PEST_CONTROL"])
      .optional(),
    imageUrl: z.union([z.string().trim().url(), z.literal("")]).nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((data) => Object.keys(data).some((key) => key !== "reason"), {
    message: "Provide at least one field to update.",
  });

const deleteSchema = z.object({
  confirm: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

function statusAction(status: string) {
  if (status === "ACTIVE") return "SERVICE_ACTIVATED";
  if (status === "SUSPENDED") return "SERVICE_SUSPENDED";
  return "SERVICE_DEACTIVATED";
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
        "Please check the service details.",
        { errors: parsed.error.flatten().fieldErrors }
      );
    }

    const existing = await db.service.findUnique({ where: { id } });

    if (!existing) {
      return apiError(404, "SERVICE_NOT_FOUND", "Service not found.");
    }

    const { reason, imageUrl, ...fields } = parsed.data;

    const service = await db.$transaction(async (tx: any ) => {
      const updated = await tx.service.update({
        where: { id },
        data: {
          ...fields,
          ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
        },
      });

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action:
          fields.status && fields.status !== existing.status
            ? statusAction(fields.status)
            : "SERVICE_UPDATED",
        entityType: "SERVICE",
        entityId: id,
        reason,
        changes: {
          before: {
            name: existing.name,
            status: existing.status,
            slug: existing.slug,
          },
          after: {
            name: updated.name,
            status: updated.status,
            slug: updated.slug,
          },
        },
      });

      return updated;
    });

    const message =
      service.status === "SUSPENDED"
        ? `${service.name} has been suspended and will not accept new bookings.`
        : service.status === "INACTIVE"
          ? `${service.name} has been deactivated.`
          : service.status === "ACTIVE" && existing.status !== "ACTIVE"
            ? `${service.name} is available for customers again.`
            : "Service updated successfully.";

    return apiSuccess(message, { service });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return apiError(
        409,
        "SERVICE_SLUG_TAKEN",
        "That service slug is already in use."
      );
    }

    console.error("Update service error:", error);
    return apiError(
      500,
      "SERVICE_UPDATE_FAILED",
      "Unable to update the service right now."
    );
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
        "Type the service name to confirm deletion."
      );
    }

    const existing = await db.service.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true, reviews: true } } },
    });

    if (!existing) {
      return apiError(404, "SERVICE_NOT_FOUND", "Service not found.");
    }

    if (parsed.data.confirm !== existing.name) {
      return apiError(
        422,
        "CONFIRMATION_MISMATCH",
        "The confirmation text does not match the service name."
      );
    }

    if (existing._count.bookings > 0 || existing._count.reviews > 0) {
      return apiError(
        409,
        "SERVICE_HAS_HISTORY",
        "This service has bookings or reviews. Deactivate or suspend it instead so historical records stay intact."
      );
    }

    await db.$transaction(async (tx: any ) => {
      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "SERVICE_DELETED",
        entityType: "SERVICE",
        entityId: id,
        reason: parsed.data.reason,
        changes: { before: { name: existing.name, slug: existing.slug } },
      });
      await tx.service.delete({ where: { id } });
    });

    return apiSuccess("The service was permanently removed.", {
      serviceId: id,
    });
  } catch (error) {
    console.error("Delete service error:", error);
    return apiError(
      500,
      "SERVICE_DELETE_FAILED",
      "Unable to delete the service right now."
    );
  }
}
