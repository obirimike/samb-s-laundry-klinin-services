
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import { limitRequest, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resetSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid reset token."),
    password: z
      .string()
      .min(8, "Password must contain at least 8 characters.")
      .max(72, "Password must not exceed 72 characters.")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Password is too long."
      ),
  })
  .strict();

function invalidTokenResponse() {
  return NextResponse.json(
    {
      message:
        "This password reset link is invalid or has expired. Please request a new one.",
    },
    { status: 400 }
  );
}

export async function POST(request: Request) {
  try {
    const rateLimit = await limitRequest(request, "passwordReset");

    if (rateLimit && !rateLimit.success) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
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

    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ?? "Invalid password reset details.",
        },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256")
      .update(parsed.data.token)
      .digest("hex");

    const now = new Date();

    const resetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: {
          select: {
            passwordHash: true,
          },
        },
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= now
    ) {
      return invalidTokenResponse();
    }

    if (
      resetToken.user.passwordHash &&
      (await compare(parsed.data.password, resetToken.user.passwordHash))
    ) {
      return NextResponse.json(
        { message: "Choose a password different from your current password." },
        { status: 400 }
      );
    }

    const newPasswordHash = await hash(parsed.data.password, 12);

    const resetSucceeded = await db.$transaction(async (tx: any ) => {
      // Claim the token only if it is still unused and unexpired.
      // This prevents two simultaneous requests from using it.
      const claimedToken = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          usedAt: now,
        },
      });

      if (claimedToken.count !== 1) {
        return false;
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: newPasswordHash,
          sessionVersion: { increment: 1 },
        },
      });

      // Invalidate every other outstanding reset link for this user.
      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });

      return true;
    });

    if (!resetSucceeded) {
      return invalidTokenResponse();
    }

    return NextResponse.json({
      message: "Your password has been reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Password reset failed:", error);

    return NextResponse.json(
      { message: "Unable to reset your password. Please try again." },
      { status: 500 }
    );
  }
}
