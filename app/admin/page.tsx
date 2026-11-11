
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/BackToTop";

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

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const [
    totalBookings,
    pendingBookings,
    activeBookings,
    completedBookings,
    totalCustomers,
    recentBookings,
  ] = await Promise.all([
    db.booking.count(),
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.count({
      where: { status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
    }),
    db.booking.count({ where: { status: "COMPLETED" } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        preferredDate: true,
        preferredTime: true,
        createdAt: true,
        customer: {
          select: { name: true, email: true },
        },
        service: {
          select: { name: true },
        },
      },
    }),
  ]);

  const stats = [
    {
      label: "All bookings",
      value: totalBookings,
      icon: ClipboardList,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Awaiting review",
      value: pendingBookings,
      icon: Clock3,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Active jobs",
      value: activeBookings,
      icon: CalendarClock,
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Completed",
      value: completedBookings,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Customers",
      value: totalCustomers,
      icon: Users,
      color: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
              SAMB&apos;s management
            </p>
            <h1 className="mt-8 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Admin dashboard
            </h1>
            <p className="mt-3 text-slate-600">
              Welcome, {session.user.name || "Administrator"}. Here&apos;s the
              current booking overview.
            </p>
          </header>

          <section
            aria-label="Booking overview"
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-600">
                      {stat.label}
                    </span>
                    <span className={`rounded-xl p-2 ${stat.color}`}>
                      <Icon size={20} />
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-extrabold text-slate-900">
                    {stat.value}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/staff"
              className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-slate-900">
                Staff Management
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create staff accounts and review their active assignments.
              </p>
            </Link>

            <Link
              href="/admin/assignments"
              className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-slate-900">
                Staff Assignments
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Assign, replace, or unassign staff from confirmed bookings and review assignment history.
              </p>
            </Link>

            <Link
              href="/admin/messages"
              className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-slate-900">
                Contact Messages
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                View, resolve and archive enquiries submitted through the contact form.
              </p>
            </Link>

            <Link
              href="/admin/audit-logs"
              className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-slate-900">
                Audit Logs
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review a filterable history of all administrative actions performed on the platform.
              </p>
            </Link>
          </section>

          <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recent bookings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  The latest service requests from customers.
                </p>
              </div>

              <Link
                href="/admin/bookings"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                View all bookings <ArrowRight size={16} />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardList
                  size={32}
                  className="mx-auto text-slate-400"
                />
                <p className="mt-3 font-semibold text-slate-900">
                  No booking requests yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  New customer requests will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentBookings.map((booking: any) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:p-6"
                  >
                    <div className="min-w-0">
                      <p className="break-all font-bold text-slate-900">
                        {booking.bookingNumber}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {booking.service.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {booking.customer.name} · {booking.customer.email}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-sm text-slate-600">
                        {formatDate(booking.preferredDate)} ·{" "}
                        {booking.preferredTime}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusStyle(booking.status)}`}
                      >
                        {booking.status.replaceAll("_", " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <BackToTop />
      <Footer />
    </>
  );
}
