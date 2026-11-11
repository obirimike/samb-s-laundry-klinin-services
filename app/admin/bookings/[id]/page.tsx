import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, UserRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import BookingManager from "@/components/admin/booking-manager";
import WhatsAppButton from "@/components/admin/WhatsAppButton";
import { buildBookingWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type AdminBookingPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  if (value === null || value === "") return null;

  return (
    <div className="border-b border-slate-100 py-4 last:border-b-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
        {value}
      </p>
    </div>
  );
}

export default async function AdminBookingDetailPage({
  params,
}: AdminBookingPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
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
          description: true,
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const bookingWhatsAppMessage = buildBookingWhatsAppMessage({
    customerName: booking.customer.name,
    bookingNumber: booking.bookingNumber,
    serviceName: booking.service.name,
    preferredDate: booking.preferredDate,
    preferredTime: booking.preferredTime,
  });

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            Back to all bookings
          </Link>

          <div className="mt-7">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
              Admin booking management
            </p>
            <h1 className="mt-2 break-all text-3xl font-extrabold text-slate-900 sm:text-4xl">
              {booking.bookingNumber}
            </h1>
            <p className="mt-3 text-slate-600">
              Submitted {formatDate(booking.createdAt)}
            </p>
          </div>

          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <UserRound size={22} className="text-blue-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Customer information
                  </h2>
                </div>

                <div className="mt-3">
                  <Detail label="Customer name" value={booking.customer.name} />
                  <Detail label="Email" value={booking.customer.email} />
                  <Detail label="Phone" value={booking.customer.phone} />
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Direct communication
                  </p>
                  <WhatsAppButton
                    phone={booking.customer.phone}
                    message={bookingWhatsAppMessage}
                    showHelperText
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <CalendarDays size={22} className="text-blue-700" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Requested service
                  </h2>
                </div>

                <div className="mt-3">
                  <Detail label="Service" value={booking.service.name} />
                  <Detail
                    label="Category"
                    value={
                      booking.service.category === "LAUNDRY"
                        ? "Laundry"
                        : booking.service.category === "DOMESTIC_SUPPORT"
                        ? "Domestic Support"
                        : booking.service.category === "PEST_CONTROL"
                        ? "Pest Control"
                        : "Cleaning"
                    }
                  />
                  <Detail
                    label="Description"
                    value={booking.service.description}
                  />
                  <Detail
                    label="Preferred date"
                    value={formatDate(booking.preferredDate)}
                  />
                  <Detail label="Preferred time" value={booking.preferredTime} />
                  <Detail label="Property type" value={booking.propertyType} />
                  <Detail
                    label="Number of rooms"
                    value={booking.numberOfRooms}
                  />
                  <Detail label="Estimated size" value={booking.estimatedSize} />
                  <Detail
                    label="Special instructions"
                    value={booking.specialInstructions}
                  />
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-4">
                  <MapPin
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-700"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Service address
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                      {booking.address}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-slate-500">
                  Current status
                </p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {booking.status.replaceAll("_", " ")}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Pricing is negotiable and should be discussed with the
                  customer based on the scope of work before confirming service
                  arrangements.
                </p>
              </section>

              <BookingManager
                bookingId={booking.id}
                bookingNumber={booking.bookingNumber}
                currentStatus={booking.status}
                initialNotes={booking.adminNotes || ""}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
