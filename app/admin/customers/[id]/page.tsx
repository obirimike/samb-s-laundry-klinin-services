import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import CustomerManager from "@/components/admin/CustomerManager";

export const dynamic = "force-dynamic";

type CustomerDetailProps = {
  params: Promise<{ id: string }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function AdminCustomerDetailPage({
  params,
}: CustomerDetailProps) {
  const session = await auth();

  if (!session?.user) redirect("/login?callbackUrl=%2Fadmin%2Fcustomers");
  if (session.user.role !== "ADMIN") redirect("/account");

  const { id } = await params;

  const customer = await db.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      accountStatus: true,
      createdAt: true,
      bookings: {
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          preferredDate: true,
          preferredTime: true,
          createdAt: true,
          service: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });

  if (!customer) notFound();

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft size={17} /> Back to customers
          </Link>

          <div className="mt-7">
            <CustomerManager
              customer={{
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                accountStatus: customer.accountStatus,
                createdAt: customer.createdAt.toISOString(),
                bookingCount: customer.bookings.length,
              }}
            />
          </div>

          <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <CalendarDays size={22} className="text-blue-700" />
                <h2 className="text-xl font-bold text-slate-900">
                  Booking history
                </h2>
              </div>
            </div>

            {customer.bookings.length === 0 ? (
              <p className="p-8 text-sm text-slate-500">
                This customer has not submitted any bookings yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {customer.bookings.map((booking: any) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="flex flex-col justify-between gap-3 p-5 hover:bg-slate-50 sm:flex-row sm:items-center transition"
                  >
                    <div>
                      <p className="break-all font-bold text-slate-900">
                        {booking.bookingNumber}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {booking.service.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Preferred: {formatDate(booking.preferredDate)} ·{" "}
                        {booking.preferredTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                        {booking.status.replaceAll("_", " ")}
                      </span>
                      <ArrowRight size={17} className="text-slate-400" />
                    </div>
                  </Link>
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
