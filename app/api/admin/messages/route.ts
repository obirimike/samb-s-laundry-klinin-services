
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { db } from "@/lib/db";
import { ContactMessageStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const messages = await db.contactMessage.findMany({
      where: status && status !== "ALL" && Object.values(ContactMessageStatus).includes(status as ContactMessageStatus)
        ? { status: status as ContactMessageStatus }
        : {},
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return apiSuccess("Contact messages retrieved.", { messages });
  } catch (error) {
    console.error("Fetch contact messages error:", error);
    return apiError(500, "MESSAGES_FETCH_FAILED", "Unable to load contact messages.");
  }
}

