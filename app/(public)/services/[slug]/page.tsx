import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Sparkles,
  WashingMachine,
  CalendarCheck,
  Home,
  Bug,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  getServiceImageUrl,
  getServiceHighlights,
} from "@/lib/services-data";
import PublishedReviews from "@/components/services/PublishedReviews";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ServicePageProps) {
  const { slug } = await params;

  const service = await db.service.findFirst({
    where: { slug, status: "ACTIVE" },
  });

  if (!service) {
    return { title: "Service not found | SAMB's" };
  }

  return {
    title: `${service.name} | SAMB's Laundry and Klinin Services`,
    description: service.description,
  };
}

export default async function ServiceDetailPage({
  params,
}: ServicePageProps) {
  const { slug } = await params;

  const service = await db.service.findFirst({
    where: {
      slug,
      status: "ACTIVE",
    },
  });

  if (!service) {
    notFound();
  }

  function getCategoryMeta(category: string) {
    switch (category) {
      case "LAUNDRY":
        return {
          label: "Laundry Care",
          icon: <WashingMachine size={22} />,
          badgeColor: "bg-sky-500/20 text-sky-300",
          textColor: "text-sky-300",
          checkColor: "text-sky-600",
        };
      case "DOMESTIC_SUPPORT":
        return {
          label: "House Help & Domestic Support",
          icon: <Home size={22} />,
          badgeColor: "bg-emerald-500/20 text-emerald-300",
          textColor: "text-emerald-300",
          checkColor: "text-emerald-600",
        };
      case "PEST_CONTROL":
        return {
          label: "Fumigation & Pest Control",
          icon: <Bug size={22} />,
          badgeColor: "bg-amber-500/20 text-amber-300",
          textColor: "text-amber-300",
          checkColor: "text-amber-600",
        };
      case "CLEANING":
      default:
        return {
          label: "Cleaning Service",
          icon: <Sparkles size={22} />,
          badgeColor: "bg-blue-500/20 text-blue-300",
          textColor: "text-blue-300",
          checkColor: "text-blue-600",
        };
    }
  }

  const catMeta = getCategoryMeta(service.category);
  const imageUrl = getServiceImageUrl(service.slug, service.category, service.imageUrl);
  const highlights = getServiceHighlights(service.slug, service.category);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero with Service Backdrop */}
      <section className="relative overflow-hidden bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-slate-950 to-slate-950" />
        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-200 transition hover:text-white"
          >
            <ArrowLeft size={17} /> All services
          </Link>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${catMeta.badgeColor}`}>
                  {catMeta.icon}
                </div>
                <span className={`text-xs font-bold uppercase tracking-[0.18em] ${catMeta.textColor}`}>
                  {catMeta.label}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                {service.name}
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
                {service.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={`/book?service=${service.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 font-bold text-white transition hover:bg-blue-400"
                >
                  <CalendarCheck size={18} /> Book this service
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
                >
                  Inquire details
                </Link>
              </div>
            </div>

            {/* Featured Image Frame */}
            <div className="relative aspect-[16/10] w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-slate-900 shadow-2xl lg:w-[480px]">
              <Image
                src={imageUrl}
                alt={service.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Detail Content & Booking Sidebar */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900">
              About this service
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              {service.description} Our professional team delivers tailored
              attention to ensure outstanding results. The final scope can be
              customized to your preferences and schedule.
            </p>

            <h3 className="mt-8 text-lg font-bold text-slate-900">
              Key Features &amp; Inclusions
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                >
                  <CheckCircle2
                    size={18}
                    className={`shrink-0 ${catMeta.checkColor}`}
                  />
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <h3 className="mt-8 text-lg font-bold text-slate-900">
              How Our Process Works
            </h3>

            <ul className="mt-4 space-y-4">
              {[
                "Submit your request online with preferred date and instructions.",
                "Our team reviews property details, items, or laundry volume.",
                "Receive transparent confirmation and scheduling details.",
                "Service is completed to top quality standards.",
              ].map((item, index) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {index + 1}
                  </span>
                  <span className="leading-6 text-slate-600">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <Clock3 className="text-blue-700" size={22} />
                <h3 className="font-bold text-slate-900">
                  Flexible scheduling &amp; transparent communication
                </h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You can select your preferred time during booking. We contact you to
                confirm all aspects before our team arrives.
              </p>
            </div>

            <PublishedReviews serviceId={service.id} />
          </div>

          {/* Booking Summary Box */}
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-xl font-extrabold text-slate-900">
              Booking summary
            </h2>

            <div className="mt-6 border-b border-slate-100 pb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </p>
              <p className="mt-1 font-bold text-slate-900">
                {catMeta.label}
              </p>
            </div>

            <div className="border-b border-slate-100 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pricing model
              </p>
              <p className="mt-1 font-bold text-slate-900">Custom quotation</p>
              <p className="mt-1 text-xs text-slate-500">
                customized based on room size, load, or special requests.
              </p>
            </div>

            <div className="py-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Next step
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Proceed to the booking request form to select your date and time.
              </p>
            </div>

            <Link
              href={`/book?service=${service.slug}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#031c43] px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-[#031c43] hover:shadow"
            >
              Book this service <ArrowRight size={17} />
            </Link>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
              <MessageCircle size={14} className="text-slate-400" />
              Reviewed promptly by our team
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
