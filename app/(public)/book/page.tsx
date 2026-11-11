import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import dynamic from "next/dynamic";
import Skeleton from "@/components/ui/Skeleton";

const BookingForm = dynamic(
  () => import("@/components/booking/BookingForm"),
  {
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-12 w-48 rounded-xl bg-blue-900/30" />
      </div>
    ),
  }
);

type BookingPageProps = {
  searchParams: Promise<{ service?: string }>;
};

export default async function BookingPage({
  searchParams,
}: BookingPageProps) {
  const query = await searchParams;

  // Preserve the selected service when the customer signs in.
  const bookingPath = query.service
    ? `/book?service=${encodeURIComponent(query.service)}`
    : "/book";

  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(bookingPath)}`);
  }

  if (session.user.role !== "CUSTOMER") {
    redirect("/account");
  }

  const services = await db.service.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      category: true,
      slug: true,
      description: true,
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const selectedService = query.service
    ? services.find((service: any) => service.slug === query.service || service.id === query.service)
    : undefined;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-[#031c43] px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex rounded-xl bg-white/10 p-3 text-blue-200">
            <ClipboardList size={28} />
          </div>

          <h1 className="mt-5 text-3xl font-black sm:text-4xl">
            Request a service
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            Tell us what you need and when you would prefer the service.
            Our team will review your request and discuss availability and
            pricing before confirming your booking.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 border-b border-slate-100 pb-5">
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="mt-1 font-semibold text-slate-900">
              {session.user.name || session.user.email}
            </p>
          </div>

          <BookingForm
            services={services}
            initialServiceId={selectedService?.id}
          />
        </div>
      </section>
    </main>
  );
}