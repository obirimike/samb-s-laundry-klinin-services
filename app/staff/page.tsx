import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return value.toLocaleDateString("en-GH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Accra",
  });
}

export default async function StaffDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");

  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role !== "STAFF") redirect("/account");

  const assignments = await db.bookingAssignment.findMany({
    where: {
      staffId: session.user.id,
      isActive: true,
      booking: {
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
    },
    orderBy: { assignedAt: "desc" },
    include: {
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          preferredDate: true,
          preferredTime: true,
          address: true,
          specialInstructions: true,
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
          service: {
            select: {
              name: true,
              category: true,
            },
          },
        },
      },
    },
  });

  const activeCount = assignments.length;
  const inProgressCount = assignments.filter(
    (assignment: any) => assignment.booking.status === "IN_PROGRESS"
  ).length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Staff workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Welcome, {session.user.name || "Team member"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            View your current assignments and the details needed for each service.
          </p>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active assignments</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Services in progress</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {inProgressCount}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            My assigned bookings
          </h2>

          {assignments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <h3 className="font-semibold text-slate-900">
                No active assignments
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                New assignments will appear here when an administrator assigns
                you to a confirmed booking.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {assignments.map((assignment: any) => {
                const booking = assignment.booking;

                return (
                  <article
                    key={assignment.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {booking.bookingNumber}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {booking.service.name}
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                        {booking.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3 text-sm">
                      <p>
                        <span className="font-semibold text-slate-700">
                          Date:
                        </span>{" "}
                        <span className="text-slate-600">
                          {formatDate(booking.preferredDate)}
                        </span>
                      </p>

                      <p>
                        <span className="font-semibold text-slate-700">
                          Preferred time:
                        </span>{" "}
                        <span className="text-slate-600">
                          {booking.preferredTime}
                        </span>
                      </p>

                      <div>
                        <p className="font-semibold text-slate-700">Address</p>
                        <p className="mt-1 whitespace-pre-wrap text-slate-600">
                          {booking.address}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-700">
                          Customer contact
                        </p>
                        <p className="mt-1 text-slate-600">
                          {booking.customer.name}
                        </p>
                        {booking.customer.phone && (
                          <p className="mt-1 text-slate-600">
                            {booking.customer.phone}
                          </p>
                        )}
                      </div>

                      {booking.specialInstructions && (
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="font-semibold text-slate-700">
                            Customer instructions
                          </p>
                          <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-600">
                            {booking.specialInstructions}
                          </p>
                        </div>
                      )}

                      {assignment.notes && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                          <p className="font-semibold text-blue-900">
                            Assignment notes
                          </p>
                          <p className="mt-1 whitespace-pre-wrap leading-6 text-blue-800">
                            {assignment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
