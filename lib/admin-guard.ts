import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { limitRequest, rateLimitHeaders } from "@/lib/rate-limit";

export async function assertAdmin(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      session: null,
      response: apiError(401, "SIGN_IN_REQUIRED", "Please sign in."),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      response: apiError(
        403,
        "ADMIN_REQUIRED",
        "Administrator access is required."
      ),
    };
  }

  try {
    const rateLimit = await limitRequest(request, "admin", session.user.id);

    if (rateLimit && !rateLimit.success) {
      return {
        session: null,
        response: apiError(
          429,
          "TOO_MANY_REQUESTS",
          "You've made too many requests in a short period. Please wait before trying again.",
          undefined,
          rateLimitHeaders(rateLimit)
        ),
      };
    }
  } catch (error) {
    console.error("Admin rate limit error:", error);

    return {
      session: null,
      response: apiError(
        503,
        "SERVICE_UNAVAILABLE",
        "SAMB is temporarily unable to process your request. Please try again shortly."
      ),
    };
  }

  return { session, response: null };
}
