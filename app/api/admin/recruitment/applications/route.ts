import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const vacancyId = searchParams.get("vacancyId");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.JobApplicationWhereInput = {};

    if (status && status !== "ALL") {
      where.status = status as Prisma.EnumApplicationStatusFilter;
    }

    if (vacancyId === "GENERAL") {
      where.vacancyId = null;
    } else if (vacancyId && vacancyId !== "ALL") {
      where.vacancyId = vacancyId;
    }

    if (search) {
      where.OR = [
        { applicationReference: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, applications] = await Promise.all([
      db.jobApplication.count({ where }),
      db.jobApplication.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          applicationReference: true,
          vacancyId: true,
          fullName: true,
          email: true,
          phone: true,
          location: true,
          cvFileName: true,
          cvFileSize: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          vacancy: {
            select: {
              id: true,
              title: true,
              department: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return apiSuccess("Applications retrieved.", {
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Fetch applications error:", error);
    return apiError(
      500,
      "APPLICATIONS_FETCH_FAILED",
      "Unable to load job applications."
    );
  }
}
