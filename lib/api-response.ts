import { NextResponse } from "next/server";

export function apiError(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
  headers?: HeadersInit
) {
  return NextResponse.json(
    {
      success: false,
      message,
      error: { code, message },
      ...extra,
    },
    { status, headers }
  );
}

export function apiSuccess(
  message: string,
  data: Record<string, unknown> = {},
  status = 200
) {
  // Extract any conflicting `message` inside data so it cannot overwrite the top-level string message
  const restData = { ...data };
  delete restData.message;
  return NextResponse.json(
    {
      success: true,
      ...restData,
      message,
      data,
    },
    { status }
  );
}

// Pre-configured standardized HTTP error responses (Phase 5 & 7)
export const HttpErrors = {
  badRequest: (
    message = "The request could not be processed because some information is invalid or incomplete.",
    extra?: Record<string, unknown>
  ) => apiError(400, "BAD_REQUEST", message, extra),

  unauthorized: (
    message = "You need to sign in to access this page.",
    extra?: Record<string, unknown>
  ) => apiError(401, "UNAUTHORIZED", message, extra),

  forbidden: (
    message = "You don't have permission to access this page or perform this action.",
    extra?: Record<string, unknown>
  ) => apiError(403, "ACCESS_DENIED", message, extra),

  notFound: (
    message = "The page or resource you're looking for doesn't exist, may have been moved, or is no longer available.",
    extra?: Record<string, unknown>
  ) => apiError(404, "NOT_FOUND", message, extra),

  methodNotAllowed: (
    message = "This operation is not supported.",
    extra?: Record<string, unknown>
  ) => apiError(405, "METHOD_NOT_ALLOWED", message, extra),

  conflict: (
    message = "The requested change conflicts with the current state of this record. Refresh the page and try again.",
    extra?: Record<string, unknown>
  ) => apiError(409, "STATE_CONFLICT", message, extra),

  validationError: (
    message = "Some submitted information could not be accepted. Please review your entries.",
    extra?: Record<string, unknown>
  ) => apiError(422, "VALIDATION_ERROR", message, extra),

  tooManyRequests: (
    message = "You've made too many requests in a short period. Please wait before trying again.",
    headers?: HeadersInit,
    extra?: Record<string, unknown>
  ) => apiError(429, "RATE_LIMIT_EXCEEDED", message, extra, headers),

  internalServerError: (
    message = "We encountered an unexpected problem while processing your request.",
    extra?: Record<string, unknown>
  ) => apiError(500, "INTERNAL_SERVER_ERROR", message, extra),

  serviceUnavailable: (
    message = "SAMB is temporarily unable to process your request. Please try again shortly.",
    extra?: Record<string, unknown>
  ) => apiError(503, "SERVICE_UNAVAILABLE", message, extra),
};
