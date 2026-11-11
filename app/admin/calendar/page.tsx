import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import BookingCalendar from "@/components/admin/BookingCalendar";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const records = await db.booking.findMany({
    select: {
      id: true,
      bookingNumber: true,
      preferredDate: true,
      preferredTime: true,
      status: true,
      address: true,
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
      service: {
        select: {
          name: true,
          category: true,
        },
      },
    },
    orderBy: [{ preferredDate: "asc" }, { preferredTime: "asc" }],
  });

  const bookings = records.map((booking: any) => ({
    ...booking,
    preferredDate: booking.preferredDate.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="text-sm font-semibold text-blue-800 hover:underline"
        >
          ← Back to admin dashboard
        </Link>

        <header className="rounded-2xl bg-[#031c43] p-6 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <CalendarDays size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Admin Booking Calendar
              </h1>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                View and organize customer service requests by date, status,
                and service category.
              </p>
            </div>
          </div>
        </header>

        <BookingCalendar bookings={bookings} />
      </div>
    </main>
  );
}