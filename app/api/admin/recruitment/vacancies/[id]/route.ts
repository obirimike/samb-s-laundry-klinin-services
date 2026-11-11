import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";

const updateVacancySchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  department: z.string().trim().min(2).max(100).optional(),
  location: z.string().trim().min(2).max(100).optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY", "CASUAL"])
    .optional(),
  workArrangement: z.enum(["ON_SITE", "HYBRID", "REMOTE"]).optional(),
  description: z.string().trim().min(20).max(10000).optional(),
  responsibilities: z.string().trim().min(10).max(5000).optional(),
  requirements: z.string().trim().min(10).max(5000).optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  openings: z.coerce.number().int().min(1).max(100).optional(),
  deadline: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? new Date(val) : null)),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;

    const vacancy = await db.vacancy.findUnique({
      where: { id },
      include: {
        _count: {
          select: { applications: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!vacancy) {
      return apiError(404, "VACANCY_NOT_FOUND", "Vacancy not found.");
    }

    return apiSuccess("Vacancy details retrieved.", { vacancy });
  } catch (error) {
    console.error("Fetch vacancy detail error:", error);
    return apiError(500, "VACANCY_FETCH_FAILED", "Unable to load vacancy.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = updateVacancySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid vacancy updates."
      );
    }

    const existing = await db.vacancy.findUnique({ where: { id } });
    if (!existing) {
      return apiError(404, "VACANCY_NOT_FOUND", "Vacancy not found.");
    }

    const data = parsed.data;

    let publishedAt = existing.publishedAt;
    let closedAt = existing.closedAt;

    if (data.status === "PUBLISHED" && !existing.publishedAt) {
      publishedAt = new Date();
    } else if (data.status === "CLOSED" && !existing.closedAt) {
      closedAt = new Date();
    }

    const updated = await db.$transaction(async (tx: any ) => {
      const v = await tx.vacancy.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.department !== undefined && { department: data.department }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.employmentType !== undefined && {
            employmentType: data.employmentType,
          }),
          ...(data.workArrangement !== undefined && {
            workArrangement: data.workArrangement,
          }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.responsibilities !== undefined && {
            responsibilities: data.responsibilities,
          }),
          ...(data.requirements !== undefined && {
            requirements: data.requirements,
          }),
          ...(data.skills !== undefined && { skills: data.skills }),
          ...(data.openings !== undefined && { openings: data.openings }),
          ...(data.deadline !== undefined && { deadline: data.deadline }),
          ...(data.status !== undefined && { status: data.status }),
          publishedAt,
          closedAt,
        },
      });

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "VACANCY_UPDATED",
        entityType: "VACANCY",
        entityId: id,
        changes: {
          before: {
            title: existing.title,
            status: existing.status,
            deadline: existing.deadline,
          },
          after: {
            title: v.title,
            status: v.status,
            deadline: v.deadline,
          },
        },
      });

      return v;
    });

    return apiSuccess("Vacancy updated successfully.", { vacancy: updated });
  } catch (error) {
    console.error("Update vacancy error:", error);
    return apiError(500, "VACANCY_UPDATE_FAILED", "Unable to update vacancy.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;

    const existing = await db.vacancy.findUnique({
      where: { id },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!existing) {
      return apiError(404, "VACANCY_NOT_FOUND", "Vacancy not found.");
    }

    if (existing._count.applications > 0) {
      return apiError(
        400,
        "VACANCY_HAS_APPLICATIONS",
        `Cannot delete vacancy with ${existing._count.applications} existing applicant record(s). Change status to CLOSED or ARCHIVED instead.`
      );
    }

    await db.$transaction(async (tx: any ) => {
      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "VACANCY_DELETED",
        entityType: "VACANCY",
        entityId: id,
        changes: {
          title: existing.title,
          slug: existing.slug,
        },
      });

      await tx.vacancy.delete({ where: { id } });
    });

    return apiSuccess("Vacancy deleted successfully.");
  } catch (error) {
    console.error("Delete vacancy error:", error);
    return apiError(500, "VACANCY_DELETE_FAILED", "Unable to delete vacancy.");
  }
}
