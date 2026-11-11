import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";

const moderationSchema = z
  .object({
    reviewId: z.string().uuid(),
    status: z.enum(["PUBLISHED", "HIDDEN"]),
    moderationNote: z.string().trim().max(2000).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

const deleteReviewSchema = z
  .object({
    reviewId: z.string().uuid(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export async function PATCH(request: Request) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const body = await request.json().catch(() => null);
    const parsed = moderationSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(422, "VALIDATION_ERROR", "Invalid moderation details.", {
        errors: parsed.error.flatten(),
      });
    }

    const { reviewId, status, moderationNote, reason } = parsed.data;

    const existing = await db.review.findUnique({
      where: { id: reviewId },
      include: { customer: { select: { name: true } }, service: { select: { name: true } } },
    });

    if (!existing) {
      return apiError(404, "REVIEW_NOT_FOUND", "Review not found.");
    }

    const review = await db.$transaction(async (tx: any ) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          status,
          moderationNote: moderationNote || null,
          moderatedById: guard.session.user.id,
          moderatedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          moderationNote: true,
          moderatedAt: true,
          moderatedById: true,
        },
      });

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: status === "PUBLISHED" ? "REVIEW_PUBLISHED" : "REVIEW_HIDDEN",
        entityType: "REVIEW",
        entityId: reviewId,
        reason,
        changes: {
          before: { status: existing.status, moderationNote: existing.moderationNote },
          after: { status, moderationNote },
        },
      });

      return updated;
    });

    const message =
      status === "PUBLISHED"
        ? "Review published successfully."
        : "Review hidden from public view.";

    return apiSuccess(message, { review });
  } catch (error) {
    console.error("Review moderation error:", error);
    return apiError(500, "REVIEW_MODERATION_FAILED", "Unable to moderate this review.");
  }
}

export async function DELETE(request: Request) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const body = await request.json().catch(() => null);
    const parsed = deleteReviewSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(422, "VALIDATION_ERROR", "Review ID is required.");
    }

    const { reviewId, reason } = parsed.data;

    const existing = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, rating: true, customerId: true, serviceId: true },
    });

    if (!existing) {
      return apiError(404, "REVIEW_NOT_FOUND", "Review not found.");
    }

    await db.$transaction(async (tx: any ) => {
      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "REVIEW_DELETED",
        entityType: "REVIEW",
        entityId: reviewId,
        reason,
        changes: {
          rating: existing.rating,
          customerId: existing.customerId,
          serviceId: existing.serviceId,
        },
      });

      await tx.review.delete({ where: { id: reviewId } });
    });

    return apiSuccess("Review was removed permanently.", { reviewId });
  } catch (error) {
    console.error("Delete review error:", error);
    return apiError(500, "REVIEW_DELETE_FAILED", "Unable to delete review.");
  }
}
