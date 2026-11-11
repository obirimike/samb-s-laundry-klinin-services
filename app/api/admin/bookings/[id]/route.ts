import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { sendBookingStatusEmail } from "@/lib/emails";

const updateSchema = z
  .object({
    status: z
      .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
      .optional(),
    adminNotes: z.string().max(3000).nullable().optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) => data.status !== undefined || data.adminNotes !== undefined,
    { message: "Provide a status or administrator note to update." }
  );

const deleteSchema = z.object({
  confirm: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allowedTransitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

function getBookingNotification(status: string, bookingNumber: string) {
  switch (status) {
    case "CONFIRMED":
      return {
        title: "Booking confirmed",
        message: `Your booking ${bookingNumber} has been confirmed. We look forward to serving you.`,
      };

    case "IN_PROGRESS":
      return {
        title: "Service in progress",
        message: `Work on your booking ${bookingNumber} has started.`,
      };

    case "COMPLETED":
      return {
        title: "Service completed",
        message: `Your booking ${bookingNumber} has been marked as completed. Thank you for choosing SAMB's Laundry and Klinin Services.`,
      };

    case "CANCELLED":
      return {
        title: "Booking cancelled",
        message: `Your booking ${bookingNumber} has been cancelled. Please contact us if you need assistance.`,
      };

    default:
      return null;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        "Invalid update details.",
        { errors: parsed.error.flatten().fieldErrors }
      );
    }

    const existing = await db.booking.findUnique({
      where: { id },
      select: { id: true, bookingNumber: true, status: true, adminNotes: true, customerId: true },
    });

    if (!existing) {
      return apiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    }

    const { status, adminNotes, reason } = parsed.data;

    if (
      status &&
      status !== existing.status &&
      !allowedTransitions[existing.status]?.includes(status)
    ) {
      return apiError(
        409,
        "INVALID_STATUS_TRANSITION",
        `The booking cannot move from ${existing.status} to ${status}.`
      );
    }

    const now = new Date();
    const data: {
      status?: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
      adminNotes?: string | null;
      confirmedAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
    } = {};

    let auditAction = "BOOKING_NOTES_UPDATED";

    if (status !== undefined && status !== existing.status) {
      data.status = status;
      if (status === "CONFIRMED") {
        data.confirmedAt = now;
        auditAction = "BOOKING_CONFIRMED";
      } else if (status === "COMPLETED") {
        data.completedAt = now;
        auditAction = "BOOKING_COMPLETED";
      } else if (status === "CANCELLED") {
        data.cancelledAt = now;
        auditAction = "BOOKING_CANCELLED";
      } else {
        auditAction = "BOOKING_STATUS_CHANGED";
      }
    }

    if (adminNotes !== undefined) {
      data.adminNotes = adminNotes?.trim() || null;
    }

    const updated = await db.$transaction(async (tx: any) => {
      const b = await tx.booking.update({
        where: { id },
        data,
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          customerId: true,
          updatedAt: true,
        },
      });

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: auditAction,
        entityType: "BOOKING",
        entityId: id,
        reason,
        changes: {
          before: { status: existing.status, adminNotes: existing.adminNotes },
          after: { status: b.status, adminNotes: data.adminNotes ?? existing.adminNotes },
        },
      });

      return b;
    });

    if (status && status !== existing.status) {
      const notification = getBookingNotification(
        updated.status,
        updated.bookingNumber
      );

      if (notification) {
        try {
          await db.notification.create({
            data: {
              userId: updated.customerId,
              title: notification.title,
              message: notification.message,
              type: "BOOKING_UPDATE",
            },
          });
        } catch (error) {
          console.error("Failed to create booking notification:", error);
        }
      }

      try {
        const customer = await db.user.findUnique({
          where: { id: updated.customerId },
          select: { name: true, email: true },
        });

        if (customer) {
          const emailResult = await sendBookingStatusEmail({
            to: customer.email,
            customerName: customer.name,
            bookingNumber: updated.bookingNumber,
            status: updated.status,
          });

          if (!emailResult.success) {
            console.error(
              `Email notification was not sent for booking ${updated.bookingNumber}.`
            );
          }
        }
      } catch (error) {
        console.error("Failed to send booking status email:", error);
      }
    }

    const successMessage =
      status === "CONFIRMED"
        ? `Booking ${updated.bookingNumber} has been successfully confirmed.`
        : status === "CANCELLED"
          ? `Booking ${updated.bookingNumber} has been cancelled.`
          : status === "IN_PROGRESS"
            ? `Booking ${updated.bookingNumber} is now marked as in progress.`
            : status === "COMPLETED"
              ? `Booking ${updated.bookingNumber} has been completed.`
              : "Booking details updated successfully.";

    return apiSuccess(successMessage, { booking: updated });
  } catch (error) {
    console.error("Admin booking update error:", error);
    return apiError(500, "BOOKING_UPDATE_FAILED", "Unable to update this booking right now.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        "Type the booking number to confirm deletion."
      );
    }

    const existing = await db.booking.findUnique({
      where: { id },
      include: {
        _count: {
          select: { quotes: true, assignments: true },
        },
        review: { select: { id: true } },
      },
    });

    if (!existing) {
      return apiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    }

    if (parsed.data.confirm.trim() !== existing.bookingNumber.trim()) {
      return apiError(
        422,
        "CONFIRMATION_MISMATCH",
        "The confirmation text does not match the booking number."
      );
    }

    // Safeguard check: If booking is completed or has customer review or accepted quotes, advise cancelling/archiving
    if (existing.status === "COMPLETED" || existing.review) {
      return apiError(
        409,
        "BOOKING_HAS_COMPLETED_RECORDS",
        "This booking is completed or has a customer review. Cancel or archive it instead to preserve business history."
      );
    }

    await db.$transaction(async (tx: any) => {
      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "BOOKING_DELETED",
        entityType: "BOOKING",
        entityId: id,
        reason: parsed.data.reason,
        changes: {
          before: {
            bookingNumber: existing.bookingNumber,
            status: existing.status,
            customerId: existing.customerId,
          },
        },
      });

      // Assignments and quotes cascade delete via schema
      await tx.booking.delete({ where: { id } });
    });

    return apiSuccess(`Booking ${existing.bookingNumber} was permanently removed.`, {
      bookingId: id,
      bookingNumber: existing.bookingNumber,
    });
  } catch (error) {
    console.error("Admin delete booking error:", error);
    return apiError(500, "BOOKING_DELETE_FAILED", "Unable to delete this booking right now.");
  }
}
