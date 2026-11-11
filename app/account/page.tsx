
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import SignOutButton from "@/components/auth/SignOutButton";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  if (session.user.role === "STAFF") {
    redirect("/staff");
  }

  const [
    bookings,
    totalBookings,
    awaitingBookings,
    activeBookings,
    completedBookings,
  ] = await Promise.all([
    db.booking.findMany({
      where: {
        customerId: session.user.id,
      },
      include: {
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    db.booking.count({ where: { customerId: session.user.id } }),
    db.booking.count({
      where: { customerId: session.user.id, status: "PENDING" },
    }),
    db.booking.count({
      where: {
        customerId: session.user.id,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
    }),
    db.booking.count({
      where: { customerId: session.user.id, status: "COMPLETED" },
    }),
  ]);

  const firstName = session.user.name?.split(" ")[0] || "Customer";

  const statusStyles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const bookingSummary = [
    {
      label: "All bookings",
      value: totalBookings,
      icon: ClipboardList,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Awaiting review",
      value: awaitingBookings,
      icon: Clock3,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "In progress",
      value: activeBookings,
      icon: CalendarDays,
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Completed",
      value: completedBookings,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 text-lg font-bold text-slate-900"
          >
            <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-blue-200 bg-blue-900 shadow-sm">
              <Image
                src="/images/logo/samb-logo.jpeg"
                alt="SAMB's Logo"
                fill
                sizes="36px"
                className="object-cover"
              />
            </span>
            <span className="truncate">SAMB&apos;s Services</span>
          </Link>
<div className="flex shrink-0 items-center gap-2">
            <Link
              href="/account/notifications"
              aria-label="Notifications"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-4"
            >
                <Bell size={17} aria-hidden="true" />
                <span className="hidden sm:inline">Notifications</span>
              </Link>
              <Link
                href="/account/profile"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-4"
              >
                Profile
              </Link>
             <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-3xl bg-[#031c43] p-6 text-white sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
              Customer dashboard
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Welcome, {firstName}!
            </h1>
            <p className="mt-3 max-w-xl leading-7 text-blue-100">
              Request a cleaning or laundry service and keep track of your
              bookings from one convenient place.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/book"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Sparkles size={18} aria-hidden="true" />
                Request a service
              </Link>
              <Link
                href="/account/bookings"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200/60 px-5 py-3 font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                My bookings
              </Link>
            </div>
          </section>

          <Link
            href="/account/quotes"
            className="group flex flex-col justify-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md sm:p-7"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <ClipboardList size={21} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-blue-700">
              My quotations
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review service prices, check quotation terms, and respond to
              quotes.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
              View quotations
              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>

        <section
          aria-label="Booking summary"
          className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {bookingSummary.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-600">
                    {stat.label}
                  </span>
                  <span className={`rounded-xl p-2 ${stat.color}`}>
                    <Icon size={18} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  {stat.value}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-8 sm:mt-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Recent bookings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A quick look at your latest service requests.
              </p>
            </div>

            <Link
              href="/account/bookings"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700 hover:underline"
            >
              View all <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center sm:px-6 sm:py-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Sparkles size={24} aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No bookings yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                When you request a service, your booking and its status will
                appear here.
              </p>
              <Link
                href="/book"
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
              >
                Make your first request
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
              {bookings.map((booking: any) => (
                <Link
                  key={booking.id}
                  href={`/account/bookings/${booking.id}`}
                  className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {booking.service.name}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      Booking #{booking.bookingNumber}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500">
                      <CalendarDays size={15} aria-hidden="true" />
                      {booking.preferredDate.toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[booking.status] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {booking.status.replaceAll("_", " ")}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
