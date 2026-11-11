import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";

const createVacancySchema = z.object({
  title: z.string().trim().min(3).max(150),
  department: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(100),
  employmentType: z.enum([
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "TEMPORARY",
    "CASUAL",
  ]),
  workArrangement: z.enum(["ON_SITE", "HYBRID", "REMOTE"]),
  description: z.string().trim().min(20).max(10000),
  responsibilities: z.string().trim().min(10).max(5000),
  requirements: z.string().trim().min(10).max(5000),
  skills: z.array(z.string().trim().min(1)).optional().default([]),
  openings: z.coerce.number().int().min(1).max(100).default(1),
  deadline: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? new Date(val) : null)),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).default("DRAFT"),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export async function GET(request: Request) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const vacancies = await db.vacancy.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        _count: {
          select: { applications: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return apiSuccess("Vacancies retrieved.", { vacancies });
  } catch (error) {
    console.error("Fetch vacancies error:", error);
    return apiError(500, "VACANCIES_FETCH_FAILED", "Unable to load vacancies.");
  }
}

export async function POST(request: Request) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const body = await request.json().catch(() => ({}));
    const parsed = createVacancySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid vacancy details."
      );
    }

    const data = parsed.data;
    const baseSlug = slugify(data.title);

    // Ensure unique slug
    let uniqueSlug = baseSlug;
    const existingSlug = await db.vacancy.findUnique({
      where: { slug: uniqueSlug },
    });
    if (existingSlug) {
      uniqueSlug = `${baseSlug}-${randomBytes(2).toString("hex").toLowerCase()}`;
    }

    const publishedAt = data.status === "PUBLISHED" ? new Date() : null;

    const vacancy = await db.$transaction(async (tx: any ) => {
      const created = await tx.vacancy.create({
        data: {
          title: data.title,
          slug: uniqueSlug,
          department: data.department,
          location: data.location,
          employmentType: data.employmentType,
          workArrangement: data.workArrangement,
          description: data.description,
          responsibilities: data.responsibilities,
          requirements: data.requirements,
          skills: data.skills,
          openings: data.openings,
          deadline: data.deadline,
          status: data.status,
          publishedAt,
          createdById: guard.session.user.id,
        },
      });

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "VACANCY_CREATED",
        entityType: "VACANCY",
        entityId: created.id,
        changes: {
          title: created.title,
          status: created.status,
          slug: created.slug,
        },
      });

      return created;
    });

    return apiSuccess("Vacancy created successfully.", { vacancy }, 201);
  } catch (error) {
    console.error("Create vacancy error:", error);
    return apiError(500, "VACANCY_CREATE_FAILED", "Unable to create vacancy.");
  }
}
