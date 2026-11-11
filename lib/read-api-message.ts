export function readApiMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;

  const record = payload as {
    message?: unknown;
    error?: { message?: unknown };
  };

  if (typeof record.error?.message === "string" && record.error.message) {
    return record.error.message;
  }

  if (typeof record.message === "string" && record.message) {
    return record.message;
  }

  return fallback;
}
