import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suspendedAccountResponse } from "@/lib/account-access";
import { limitRequest, rateLimitHeaders } from "@/lib/rate-limit";

const bookingSchema = z
  .object({
    serviceId: z.string().uuid(),
    preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
    address: z.string().trim().min(5).max(500),
    propertyType: z.string().trim().max(100).optional(),
    numberOfRooms: z.number().int().min(1).max(500).optional(),
    estimatedSize: z.string().trim().max(100).optional(),
    specialInstructions: z.string().trim().max(2000).optional(),
  })
  .strict();

function getTodayInGhana(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in before requesting a service." },
        { status: 401 }
      );
    }

    if (session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { message: "Only customer accounts can submit service requests." },
        { status: 403 }
      );
    }

    const suspended = await suspendedAccountResponse(session.user.id);
    if (suspended) return suspended;

    const rateLimit = await limitRequest(
      request,
      "booking",
      session.user.id
    );

    if (rateLimit && !rateLimit.success) {
      return NextResponse.json(
        { message: "Too many booking requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "The request body must contain valid JSON." },
        { status: 400 }
      );
    }

    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please check your booking details and try again.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const [year, month, day] = input.preferredDate.split("-").map(Number);
    const [hours, minutes] = input.preferredTime.split(":").map(Number);

    // Validate the actual calendar date and 24-hour time.
    const preferredDate = new Date(
      Date.UTC(year, month - 1, day, 12, 0, 0)
    );

    const dateIsValid =
      Number.isFinite(preferredDate.getTime()) &&
      preferredDate.getUTCFullYear() === year &&
      preferredDate.getUTCMonth() === month - 1 &&
      preferredDate.getUTCDate() === day;

    const timeIsValid =
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59;

    if (!dateIsValid || !timeIsValid) {
      return NextResponse.json(
        { message: "Please provide a valid preferred date and time." },
        { status: 400 }
      );
    }

    // Compare date-only values using the business's local calendar date.
    if (input.preferredDate < getTodayInGhana()) {
      return NextResponse.json(
        { message: "The preferred date cannot be in the past." },
        { status: 400 }
      );
    }

    // Never trust service availability based only on the frontend.
    const service = await db.service.findFirst({
      where: {
        id: input.serviceId,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          message: "This service is unavailable. Please choose another.",
        },
        { status: 404 }
      );
    }

    const bookingNumber = `SAMB-${Date.now()}-${randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const booking = await db.booking.create({
      data: {
        bookingNumber,
        customerId: session.user.id,
        serviceId: service.id,
        preferredDate,
        preferredTime: input.preferredTime,
        address: input.address,
        propertyType: input.propertyType || null,
        numberOfRooms: input.numberOfRooms ?? null,
        estimatedSize: input.estimatedSize || null,
        specialInstructions: input.specialInstructions || null,
        status: "PENDING",
      },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        preferredDate: true,
        preferredTime: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Your service request has been submitted successfully.",
        booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create booking error:", error);

    return NextResponse.json(
      {
        message:
          "Unable to submit your request right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
