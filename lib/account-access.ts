import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";

export async function suspendedAccountResponse(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { accountStatus: true },
  });

  if (!user || user.accountStatus === "SUSPENDED") {
    return apiError(
      403,
      "ACCOUNT_SUSPENDED",
      "This account is suspended and cannot use protected features."
    );
  }

  return null;
}
