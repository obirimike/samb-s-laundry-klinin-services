import { NextResponse } from "next/server";
import { z } from "zod";

import { suspendedAccountResponse } from "@/lib/account-access";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reviewSchema = z
  .object({
    bookingId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in to review a service." },
        { status: 401 }
      );
    }

    if (session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { message: "Only customers can submit reviews." },
        { status: 403 }
      );
    }

    const suspended = await suspendedAccountResponse(session.user.id);
    if (suspended) return suspended;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Please provide valid JSON." },
        { status: 400 }
      );
    }

    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please provide a rating from 1 to 5 and a valid comment.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { bookingId, rating, comment } = parsed.data;

    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        customerId: session.user.id,
        status: "COMPLETED",
      },
      select: {
        id: true,
        serviceId: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          message: "Only your own completed bookings can be reviewed.",
        },
        { status: 404 }
      );
    }

    const review = await db.review.create({
      data: {
        bookingId: booking.id,
        customerId: session.user.id,
        serviceId: booking.serviceId,
        rating,
        comment: comment?.trim() || null,
        status: "PENDING",
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Thank you! Your review has been submitted for moderation.",
        review: {
          ...review,
          createdAt: review.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "You have already reviewed this booking." },
        { status: 409 }
      );
    }

    console.error("Review submission failed:", error);

    return NextResponse.json(
      { message: "Unable to submit your review right now." },
      { status: 500 }
    );
  }
}
