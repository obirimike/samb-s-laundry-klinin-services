import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";

const patchApplicationSchema = z.object({
  status: z
    .enum([
      "SUBMITTED",
      "UNDER_REVIEW",
      "SHORTLISTED",
      "INTERVIEW",
      "APPROVED",
      "REJECTED",
      "WITHDRAWN",
    ])
    .optional(),
  adminNotes: z.string().trim().max(3000).optional(),
  historyNote: z.string().trim().max(500).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;

    const application = await db.jobApplication.findUnique({
      where: { id },
      include: {
        vacancy: {
          select: {
            id: true,
            title: true,
            slug: true,
            department: true,
            location: true,
            employmentType: true,
            workArrangement: true,
            status: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: {
            actor: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!application) {
      return apiError(404, "APPLICATION_NOT_FOUND", "Application not found.");
    }

    return apiSuccess("Application retrieved.", { application });
  } catch (error) {
    console.error("Fetch application error:", error);
    return apiError(
      500,
      "APPLICATION_FETCH_FAILED",
      "Unable to load application details."
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = patchApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid update request."
      );
    }

    const existing = await db.jobApplication.findUnique({ where: { id } });
    if (!existing) {
      return apiError(404, "APPLICATION_NOT_FOUND", "Application not found.");
    }

    const { status, adminNotes, historyNote } = parsed.data;
    const statusChanged = status && status !== existing.status;

    const updated = await db.$transaction(async (tx: any ) => {
      if (statusChanged) {
        await tx.applicationStatusHistory.create({
          data: {
            applicationId: id,
            previousStatus: existing.status,
            newStatus: status,
            actorId: guard.session.user.id,
            note: historyNote || undefined,
          },
        });
      }

      const app = await tx.jobApplication.update({
        where: { id },
        data: {
          ...(statusChanged && { status }),
          ...(adminNotes !== undefined && { adminNotes }),
        },
        include: {
          vacancy: {
            select: { id: true, title: true, department: true },
          },
          statusHistory: {
            orderBy: { createdAt: "desc" },
            include: {
              actor: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: statusChanged ? `APPLICATION_STATUS_${status}` : "APPLICATION_NOTE_UPDATED",
        entityType: "JOB_APPLICATION",
        entityId: id,
        reason: historyNote,
        changes: {
          reference: existing.applicationReference,
          previousStatus: existing.status,
          newStatus: status || existing.status,
        },
      });

      return app;
    });

    return apiSuccess("Application updated.", { application: updated });
  } catch (error) {
    console.error("Update application error:", error);
    return apiError(
      500,
      "APPLICATION_UPDATE_FAILED",
      "Unable to update application."
    );
  }
}
