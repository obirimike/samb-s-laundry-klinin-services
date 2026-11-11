import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

import { suspendedAccountResponse } from "@/lib/account-access";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { limitRequest, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: z
      .string()
      .min(12, "Your new password must contain at least 12 characters.")
      .refine(
        (value) => new TextEncoder().encode(value).length <= 72,
        "Your new password must not exceed 72 UTF-8 bytes."
      ),
  })
  .strict();

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in to change your password." },
        { status: 401 }
      );
    }

    const suspended = await suspendedAccountResponse(session.user.id);
    if (suspended) return suspended;

    const rateLimit = await limitRequest(
      request,
      "account",
      `${session.user.id}:password`
    );

    if (rateLimit && !rateLimit.success) {
      return NextResponse.json(
        { message: "Too many password-change attempts. Please try again later." },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimit),
        }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Please provide valid JSON." },
        { status: 400 }
      );
    }

    const parsed = passwordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ||
            "Please check your password details.",
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { message: "Unable to change the password for this account." },
        { status: 400 }
      );
    }

    const isCurrentPasswordValid = await compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { message: "Your current password is incorrect." },
        { status: 400 }
      );
    }

    const isSamePassword = await compare(
      newPassword,
      user.passwordHash
    );

    if (isSamePassword) {
      return NextResponse.json(
        {
          message: "Your new password must be different from your current password.",
        },
        { status: 400 }
      );
    }

    const newPasswordHash = await hash(newPassword, 12);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        sessionVersion: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: "Your password has been changed successfully. Please sign in again.",
    });
  } catch (error) {
    console.error("Password change failed:", error);

    return NextResponse.json(
      { message: "Unable to change your password right now. Please try again." },
      { status: 500 }
    );
  }
}