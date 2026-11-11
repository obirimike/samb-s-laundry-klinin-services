
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

function statusStyle(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800";
    case "IN_PROGRESS":
      return "bg-indigo-100 text-indigo-800";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function AdminBookingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fbookings");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const bookings = await db.booking.findMany({
    include: {
      customer: {
        select: { name: true, email: true, phone: true },
      },
      service: {
        select: { name: true, category: true },
      },
    },
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
    take: 200,
  });

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft size={17} /> Dashboard
          </Link>

          <div className="mt-7">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
              Booking management
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              All bookings
            </h1>
            <p className="mt-3 text-slate-600">
              Review customer requests and open a booking to manage its status.
            </p>
          </div>

          {bookings.length === 0 ? (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <ClipboardList size={32} className="mx-auto text-slate-400" />
              <h2 className="mt-3 font-bold text-slate-900">
                No booking requests yet
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Customer requests will appear here once submitted.
              </p>
            </section>
          ) : (
            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-600">
                Showing the latest {bookings.length} bookings.
              </div>

              <div className="divide-y divide-slate-100">
                {bookings.map((booking: any) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="flex flex-col justify-between gap-4 p-5 hover:bg-slate-50 sm:flex-row sm:items-center sm:p-6"
                  >
                    <div className="min-w-0">
                      <p className="break-all font-bold text-slate-900">
                        {booking.bookingNumber}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {booking.service.name} ·{" "}
                        {booking.service.category === "LAUNDRY"
                          ? "Laundry"
                          : booking.service.category === "DOMESTIC_SUPPORT"
                          ? "Domestic Support"
                          : booking.service.category === "PEST_CONTROL"
                          ? "Pest Control"
                          : "Cleaning"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {booking.customer.name} · {booking.customer.email}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Submitted {formatDate(booking.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-slate-600">
                        {formatDate(booking.preferredDate)} ·{" "}
                        {booking.preferredTime}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusStyle(booking.status)}`}
                      >
                        {booking.status.replaceAll("_", " ")}
                      </span>
                      <ArrowRight size={17} className="text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
