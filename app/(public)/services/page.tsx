import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import ServiceGrid from "@/components/services/ServiceGrid";

export const metadata = {
  title: "Services | SAMB's Cleaning, Laundry, Domestic Support & Pest Control",
  description:
    "Explore SAMB's professional laundry care, comprehensive cleaning, house help domestic support, and pest control services.",
};

export default async function ServicesPage() {
  const [services, reviewStats] = await Promise.all([
    db.service.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),

    db.review.groupBy({
      by: ["serviceId"],
      where: {
        status: "PUBLISHED",
      },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const statsByServiceId = new Map(
    reviewStats.map((item: any) => [
      item.serviceId,
      {
        averageRating: item._avg.rating,
        reviewCount: item._count._all,
      },
    ])
  );

  const servicesWithRatings = services.map((service: any) => {
    const stats = statsByServiceId.get(service.id);

    return {
      ...service,
      averageRating: (stats as any)?.averageRating ?? null,
      reviewCount: (stats as any)?.reviewCount ?? 0,
    };
  });

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="absolute inset-0 bg-[#031c43]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-300">
            <Sparkles size={14} />
            Professional Services &amp; Care
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            Our Services
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            From cleaning solutions and laundry care to dedicated domestic support and pest control, explore our full spectrum of specialized services.
          </p>
        </div>
      </section>

      {/* Services Grid with Interactive Tabs */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ServiceGrid services={servicesWithRatings} enableFilterTabs={true} />

        {/* Custom Help Box */}
        <div className="mt-16 rounded-3xl bg-[#031c43] p-8 text-white shadow-lg sm:p-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Not sure which service fits your space?
            </h2>
            <p className="mt-3 leading-relaxed text-blue-100">
              Tell us about your requirements, schedule, or pest concerns. Our
              team will recommend the best solution tailored to your exact needs.
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-950 transition hover:bg-blue-50"
            >
              Contact our team <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
