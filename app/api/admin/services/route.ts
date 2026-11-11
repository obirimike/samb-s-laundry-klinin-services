import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  description: z.string().trim().min(10).max(2000),
  category: z.enum(["CLEANING", "LAUNDRY", "DOMESTIC_SUPPORT", "PEST_CONTROL"]),
  imageUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export async function POST(request: Request) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const parsed = serviceSchema.safeParse(await request.json());

    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        "Please check the service details.",
        { errors: parsed.error.flatten().fieldErrors }
      );
    }

    const input = parsed.data;
    const status = input.status ?? "ACTIVE";

    const service = await db.$transaction(async (tx: any ) => {
      const created = await tx.service.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          category: input.category,
          imageUrl: input.imageUrl || null,
          status,
        },
      });

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "SERVICE_CREATED",
        entityType: "SERVICE",
        entityId: created.id,
        changes: { after: { name: created.name, status: created.status } },
      });

      return created;
    });

    return apiSuccess(
      "The new laundry service is now available for customers.",
      { service },
      201
    );
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
        "That service slug is already in use. Choose another."
      );
    }

    console.error("Create service error:", error);
    return apiError(
      500,
      "SERVICE_CREATE_FAILED",
      "Unable to create the service right now."
    );
  }
}
