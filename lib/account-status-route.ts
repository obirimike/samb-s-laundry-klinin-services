import { z } from "zod";
import { changeAccountStatus } from "@/lib/account-admin";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";

const reasonSchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

async function updateStatus(
  request: Request,
  context: RouteContext,
  role: "CUSTOMER" | "STAFF",
  status: "ACTIVE" | "SUSPENDED"
) {
  const guard = await assertAdmin(request);
  if (guard.response) return guard.response;

  const parsed = reasonSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return apiError(422, "VALIDATION_ERROR", "The reason is not valid.");
  }

  const { id } = await context.params;
  const result = await changeAccountStatus({
    actorId: guard.session.user.id,
    userId: id,
    role,
    status,
    reason: parsed.data.reason,
  });

  const label = role === "CUSTOMER" ? "customer" : "staff member";

  if (result.kind === "NOT_FOUND") {
    return apiError(
      404,
      role === "CUSTOMER" ? "CUSTOMER_NOT_FOUND" : "STAFF_NOT_FOUND",
      `That ${label} could not be found.`
    );
  }

  if (result.kind === "CONFLICT") {
    return apiError(
      409,
      "ACCOUNT_STATUS_UNCHANGED",
      status === "SUSPENDED"
        ? `This ${label} is already suspended.`
        : `This ${label} is already active.`
    );
  }

  const message =
    role === "CUSTOMER"
      ? status === "SUSPENDED"
        ? "This customer's access to SAMB has been suspended."
        : "This customer can sign in and book again."
      : status === "SUSPENDED"
        ? "This staff account has been suspended."
        : "This staff account has been reactivated.";

  return apiSuccess(message, { user: result.user });
}

export function customerStatusHandler(status: "ACTIVE" | "SUSPENDED") {
  return async function POST(request: Request, context: RouteContext) {
    try {
      return await updateStatus(request, context, "CUSTOMER", status);
    } catch (error) {
      console.error("Customer status error:", error);
      return apiError(
        500,
        "CUSTOMER_STATUS_FAILED",
        "Unable to update this customer account."
      );
    }
  };
}

export function staffStatusHandler(status: "ACTIVE" | "SUSPENDED") {
  return async function POST(request: Request, context: RouteContext) {
    try {
      return await updateStatus(request, context, "STAFF", status);
    } catch (error) {
      console.error("Staff status error:", error);
      return apiError(
        500,
        "STAFF_STATUS_FAILED",
        "Unable to update this staff account."
      );
    }
  };
}
