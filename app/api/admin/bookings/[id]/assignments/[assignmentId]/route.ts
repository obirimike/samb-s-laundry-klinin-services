import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
    assignmentId: string;
  }>;
};

export async function DELETE(
  _request: Request,
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
        { message: "Only administrators can unassign staff." },
        { status: 403 }
      );
    }

    const { id: bookingId, assignmentId } = await context.params;

    const result = await db.$transaction(async (tx: any) => {
      const assignment = await tx.bookingAssignment.findFirst({
        where: {
          id: assignmentId,
          bookingId,
          isActive: true,
        },
        include: {
          staff: {
            select: { id: true, name: true },
          },
          booking: {
            select: { bookingNumber: true },
          },
        },
      });

      if (!assignment) {
        return { kind: "NOT_FOUND" as const };
      }

      const update = await tx.bookingAssignment.updateMany({
        where: {
          id: assignmentId,
          bookingId,
          isActive: true,
        },
        data: {
          isActive: false,
          unassignedAt: new Date(),
          unassignedById: session.user.id,
        },
      });

      if (update.count !== 1) {
        return { kind: "CONFLICT" as const };
      }

      await tx.notification.create({
        data: {
          userId: assignment.staff.id,
          title: "Booking assignment updated",
          message: `You have been unassigned from booking ${assignment.booking.bookingNumber}.`,
          type: "BOOKING_UNASSIGNED",
        },
      });

      await writeAudit(tx, {
        actorId: session.user.id,
        action: "ASSIGNMENT_CANCELLED",
        entityType: "BOOKING_ASSIGNMENT",
        entityId: assignmentId,
        changes: {
          bookingId,
          bookingNumber: assignment.booking.bookingNumber,
          staffId: assignment.staff.id,
          staffName: assignment.staff.name,
        },
      });

      return {
        kind: "SUCCESS" as const,
        staffName: assignment.staff.name,
        bookingNumber: assignment.booking.bookingNumber,
      };
    });

    if (result.kind === "NOT_FOUND") {
      return NextResponse.json(
        { message: "Active assignment not found." },
        { status: 404 }
      );
    }

    if (result.kind === "CONFLICT") {
      return NextResponse.json(
        { message: "The assignment has already changed. Refresh and try again." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: `${result.staffName} was unassigned from booking ${result.bookingNumber}.`,
    });
  } catch (error) {
    console.error("Failed to unassign staff:", error);

    return NextResponse.json(
      { message: "Unable to unassign staff right now." },
      { status: 500 }
    );
  }
}
