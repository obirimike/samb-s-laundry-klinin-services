
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchSchema = z.object({
  status: z.enum(["WITHDRAWN", "EXPIRED"]).optional(),
  reason: z.string().trim().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiError(401, "UNAUTHORIZED", "Please sign in.");
    }

    if (session.user.role !== "ADMIN") {
      return apiError(403, "FORBIDDEN", "Only administrators can manage quotes.");
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(422, "VALIDATION_ERROR", "Invalid update payload.", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await db.quote.findUnique({
      where: { id },
      include: { booking: { select: { customerId: true, bookingNumber: true } } },
    });

    if (!existing) {
      return apiError(404, "QUOTE_NOT_FOUND", "Quote not found.");
    }

    const { status, reason } = parsed.data;

    if (status === "WITHDRAWN") {
      if (existing.status !== "DRAFT" && existing.status !== "SENT") {
        return apiError(
          409,
          "CANNOT_WITHDRAW",
          `Quotes in ${existing.status} status cannot be withdrawn.`
        );
      }

      await db.$transaction(async (tx: any ) => {
        await tx.quote.update({
          where: { id },
          data: { status: "WITHDRAWN" },
        });

        await writeAudit(tx, {
          actorId: session.user.id,
          action: "QUOTE_WITHDRAWN",
          entityType: "QUOTE",
          entityId: id,
          reason,
          changes: {
            before: { status: existing.status },
            after: { status: "WITHDRAWN" },
          },
        });

        if (existing.status === "SENT") {
          await tx.notification.create({
            data: {
              userId: existing.booking.customerId,
              title: "Quote withdrawn",
              message: `Quote ${existing.quoteNumber} for booking ${existing.booking.bookingNumber} has been withdrawn by SAMB administration.`,
              type: "QUOTE_WITHDRAWN",
            },
          });
        }
      });

      return apiSuccess(`Quote ${existing.quoteNumber} has been withdrawn.`);
    }

    return apiError(400, "BAD_REQUEST", "No valid status change specified.");
  } catch (error) {
    console.error("Quote management error:", error);
    return apiError(500, "QUOTE_UPDATE_FAILED", "Unable to update this quote right now.");
  }
}
