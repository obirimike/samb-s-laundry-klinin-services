import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const assignmentSchema = z
  .object({
    staffId: z.string().uuid(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only administrators can assign staff." },
        { status: 403 }
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

    const parsed = assignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please check the assignment details.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { id: bookingId } = await context.params;
    const { staffId, notes } = parsed.data;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found." },
        { status: 404 }
      );
    }

    if (!["CONFIRMED", "IN_PROGRESS"].includes(booking.status)) {
      return NextResponse.json(
        {
          message:
            "Staff can only be assigned to confirmed or in-progress bookings.",
        },
        { status: 409 }
      );
    }

    const staff = await db.user.findFirst({
      where: {
        id: staffId,
        role: "STAFF",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { message: "The selected staff account was not found." },
        { status: 404 }
      );
    }

    const assignment = await db.$transaction(async (tx: any) => {
      const existing = await tx.bookingAssignment.findFirst({
        where: {
          bookingId,
          staffId,
          isActive: true,
        },
        select: { id: true },
      });

      if (existing) {
        return null;
      }

      const created = await tx.bookingAssignment.create({
        data: {
          bookingId,
          staffId,
          assignedById: session.user.id,
          notes: notes?.trim() || null,
        },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: staffId,
          title: "New booking assignment",
          message: `You have been assigned to booking ${booking.bookingNumber}.`,
          type: "BOOKING_ASSIGNED",
        },
      });

      await writeAudit(tx, {
        actorId: session.user.id,
        action: "ASSIGNMENT_CREATED",
        entityType: "BOOKING_ASSIGNMENT",
        entityId: created.id,
        changes: {
          bookingId,
          bookingNumber: booking.bookingNumber,
          staffId,
          staffName: staff.name,
        },
      });

      return created;
    });

    if (!assignment) {
      return NextResponse.json(
        { message: "This staff member is already assigned to the booking." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: `${staff.name} has been assigned to booking ${booking.bookingNumber}.`,
        assignment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to assign staff:", error);

    return NextResponse.json(
      { message: "Unable to assign staff right now." },
      { status: 500 }
    );
  }
}
