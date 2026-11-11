
import { NextResponse } from "next/server";
import { z } from "zod";

import { suspendedAccountResponse } from "@/lib/account-access";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { limitRequest, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine(
        (value) =>
          value === "" ||
          (/^[+\d().\s-]+$/.test(value) &&
            value.replace(/\D/g, "").length >= 7),
        "Enter a valid phone number."
      ),
  })
  .strict();

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in to update your profile." },
        { status: 401 }
      );
    }

    const suspended = await suspendedAccountResponse(session.user.id);
    if (suspended) return suspended;

    const rateLimit = await limitRequest(
      request,
      "account",
      session.user.id
    );

    if (rateLimit && !rateLimit.success) {
      return NextResponse.json(
        { message: "Too many profile updates. Please try again later." },
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

    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please check your name and phone number.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, phone } = parsed.data;

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({
      message: "Your profile has been updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Profile update failed:", error);

    return NextResponse.json(
      { message: "Unable to update your profile right now." },
      { status: 500 }
    );
  }
}
