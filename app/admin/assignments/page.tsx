import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import AssignmentManagement from "@/components/admin/AssignmentManagement";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentsPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  const [bookings, staff] = await Promise.all([
    db.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
      orderBy: [{ preferredDate: "asc" }, { preferredTime: "asc" }],
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
            category: true,
          },
        },
        assignments: {
          orderBy: { assignedAt: "desc" },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            assignedBy: {
              select: { name: true },
            },
            unassignedBy: {
              select: { name: true },
            },
          },
        },
      },
    }),

    db.user.findMany({
      where: { role: "STAFF" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
  ]);

  const initialBookings = bookings.map((booking: any) => ({
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    preferredDate: booking.preferredDate.toISOString(),
    preferredTime: booking.preferredTime,
    address: booking.address,
    specialInstructions: booking.specialInstructions,
    customer: booking.customer,
    service: booking.service,
    assignments: booking.assignments.map((assignment: any) => ({
      id: assignment.id,
      staffId: assignment.staffId,
      staff: assignment.staff,
      notes: assignment.notes,
      isActive: assignment.isActive,
      assignedAt: assignment.assignedAt.toISOString(),
      unassignedAt: assignment.unassignedAt?.toISOString() ?? null,
      assignedByName: assignment.assignedBy.name,
      unassignedByName: assignment.unassignedBy?.name ?? null,
    })),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AssignmentManagement
        initialBookings={initialBookings}
        staff={staff}
      />
    </main>
  );
}
