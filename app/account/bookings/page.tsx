
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Clock3,
  Plus,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import ReviewForm from "@/components/account/ReviewForm";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getStatusStyle(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800";
    case "IN_PROGRESS":
      return "bg-violet-100 text-violet-800";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function BookingHistoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "CUSTOMER") {
    redirect("/account");
  }

  const bookings = await db.booking.findMany({
    where: {
      customerId: session.user.id,
    },
    include: {
      service: {
        select: {
          name: true,
          category: true,
        },
      },
      review: {
        select: {
          id: true,
          status: true,
          rating: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to account
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
                Customer dashboard
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                My bookings
              </h1>
              <p className="mt-3 text-slate-600">
                Review your service requests and check their latest status.
              </p>
            </div>

            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#031c43] px-5 py-3 font-semibold text-white hover:bg-blue-800"
            >
              <Plus size={18} />
              Request a service
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Total requests</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {bookings.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Awaiting review</p>
              <p className="mt-2 text-3xl font-extrabold text-amber-600">
                {bookings.filter((booking: any) => booking.status === "PENDING").length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Completed</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600">
                {bookings.filter((booking: any) => booking.status === "COMPLETED").length}
              </p>
            </div>
          </div>

          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList size={20} className="text-slate-500" />
              <h2 className="text-lg font-bold text-slate-900">
                Booking history
              </h2>
            </div>

            {bookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <CalendarDays size={27} />
                </span>
                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  No bookings yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  When you request a cleaning or laundry service, it will
                  appear here so you can follow its progress.
                </p>
                <Link
                  href="/services"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#031c43] px-5 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  Explore services <ArrowRight size={17} />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking: any) => (
                  <article
                    key={booking.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            {booking.service.name}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(booking.status)}`}
                          >
                            {formatStatus(booking.status)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          Reference:{" "}
                          <span className="font-semibold text-slate-700">
                            {booking.bookingNumber}
                          </span>
                        </p>

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays size={16} />
                            {formatDate(booking.preferredDate)}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Clock3 size={16} />
                            {booking.preferredTime}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/account/bookings/${booking.id}`}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700"
                      >
                        View details <ArrowRight size={16} />
                      </Link>
                    </div>

                    {booking.status === "COMPLETED" && !booking.review && (
                      <div className="mt-5 rounded-xl border border-slate-200 p-4">
                        <h3 className="font-bold text-slate-900">
                          How was your service?
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Share feedback on your completed booking.
                        </p>

                        <ReviewForm
                          bookingId={booking.id}
                          bookingNumber={booking.bookingNumber}
                        />
                      </div>
                    )}

                    {booking.review && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="font-semibold text-slate-800">
                          Your review: {booking.review.rating}/5 stars
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Status: {booking.review.status.toLowerCase()}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-500">
                        Submitted on {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
