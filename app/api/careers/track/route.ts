import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { limitRequest, rateLimitHeaders } from "@/lib/rate-limit";
import { formatApplicationStatus } from "@/lib/recruitment";

const trackSchema = z.object({
  referenceNumber: z
    .string()
    .trim()
    .min(5, "Application reference number is required.")
    .max(50, "Invalid reference number format."),
  email: z
    .string()
    .trim()
    .email("A valid email address is required.")
    .max(120),
});

export async function POST(request: Request) {
  try {
    // 1. Rate limiting
    const rateCheck = await limitRequest(request, "applicationTracking");
    if (!rateCheck || typeof rateCheck.success === "undefined") {
      return apiError(
        500,
        "RATE_LIMITING_ERROR",
        "Unable to process rate limiting. Please try again later."
      );
    }
    if (!rateCheck.success) {
      return apiError(
        429,
        "TOO_MANY_REQUESTS",
        "Too many tracking requests. Please wait a few minutes before trying again.",
        undefined,
        rateLimitHeaders(rateCheck)
      );
    }

    // 2. Validate request body
    const body = await request.json().catch(() => ({}));
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid tracking inquiry."
      );
    }

    const { referenceNumber, email } = parsed.data;

    // 3. Query job application by exact reference
    const application = await db.jobApplication.findUnique({
      where: {
        applicationReference: referenceNumber.trim().toUpperCase(),
      },
      include: {
        vacancy: {
          select: {
            title: true,
            department: true,
            location: true,
          },
        },
      },
    });

    // 4. Verification factor: applicant email must match exactly (case-insensitive)
    if (
      !application ||
      application.email.toLowerCase() !== email.trim().toLowerCase()
    ) {
      // Intentionally uniform error to prevent reference enumeration
      return apiError(
        404,
        "APPLICATION_NOT_FOUND",
        "No application was found matching this reference number and email address. Please check your information and try again."
      );
    }

    // 5. Construct safe public tracking payload
    const statusMeta = formatApplicationStatus(application.status);

    const safeResponse = {
      referenceNumber: application.applicationReference,
      appliedRole: application.vacancy
        ? application.vacancy.title
        : "General Application",
      department: application.vacancy
        ? application.vacancy.department
        : "Recruitment pool",
      location: application.location,
      status: application.status,
      statusLabel: statusMeta.label,
      statusBadgeStyle: statusMeta.badgeStyle,
      statusExplanation: statusMeta.applicantExplanation,
      submittedAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    };

    return apiSuccess("Application status retrieved.", {
      application: safeResponse,
    });
  } catch (error) {
    console.error("Application tracking error:", error);
    return apiError(
      500,
      "TRACKING_FAILED",
      "Unable to look up application status. Please try again later."
    );
  }
}
