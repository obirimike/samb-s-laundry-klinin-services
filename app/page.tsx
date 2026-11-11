
import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    Sparkles,
    ShieldCheck,
    WashingMachine,
} from "lucide-react";
import { db } from "@/lib/db";
import NavBar from "@/components/layout/NavBar";
import dynamic from "next/dynamic";
import Footer from "@/components/layout/Footer";
import ServiceCard from "@/components/services/ServiceCard";

const SignOutMessage = dynamic(
  () => import("@/components/auth/SignOutMessage")
);

type HomePageProps = {
    searchParams: Promise<{ signedOut?: string }>;
};

export default async function HomePage({
    searchParams,
}: HomePageProps) {
    const { signedOut } = await searchParams;

    const [services, reviewStats] = await Promise.all([
        db.service.findMany({
            where: { status: "ACTIVE" },
            orderBy: [{ category: "asc" }, { name: "asc" }],
            take: 6,
        }),
        db.review.groupBy({
            by: ["serviceId"],
            where: { status: "PUBLISHED" },
            _avg: { rating: true },
            _count: { _all: true },
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
        <>
            <NavBar />

            <main>
                {signedOut === "1" && <SignOutMessage />}


                <section className="relative overflow-hidden bg-slate-950 text-white">
                    <div className="absolute inset-0 bg-[#031c43]" />
                    <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#031c43]/20 blur-3xl" />
                    <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-[#031c43]/20 blur-3xl" />

                    <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:px-8 lg:py-32">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100">
                                <Sparkles size={16} />
                                Professional cleaning solutions
                            </span>

                            <h1 className="mt-7 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                                A cleaner space.
                                <span className="block text-blue-300">A better everyday.</span>
                            </h1>

                            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                                From routine and deep cleaning to post-construction care and
                                laundry services, SAMB&apos;s helps you keep your spaces fresh,
                                comfortable and ready for what matters.
                            </p>

                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-400"
                                >
                                    Request a service <ArrowRight size={18} />
                                </Link>
                                <Link
                                    href="/services"
                                    className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
                                >
                                    Explore our services
                                </Link>
                            </div>

                            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 size={17} className="text-blue-300" />
                                    personalized service options
                                </span>
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 size={17} className="text-blue-300" />
                                    Clear booking process
                                </span>
                            </div>
                        </div>

                        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-md sm:p-4">
                                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-slate-900 sm:aspect-[16/12] lg:aspect-[4/3]">
                                    <Image
                                        src="/images/hero/samb-hero.jpeg"
                                        alt="SAMB's Laundry &amp; Klinin Services - Professional office cleaners"
                                        fill
                                        priority
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl sm:flex">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                                    <ShieldCheck size={21} />
                                </span>
                                <div>
                                    <p className="text-sm font-bold">Quality-minded service</p>
                                    <p className="mt-1 text-xs text-slate-500">Attention to the details</p>
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-3 hidden items-center gap-2.5 rounded-2xl border border-white/20 bg-slate-900/90 px-4 py-2.5 text-white shadow-xl backdrop-blur-md md:flex">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                                    <WashingMachine size={16} />
                                </span>
                                <span className="text-xs font-semibold">Laundry &amp; Office Cleaners</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-1 shrink-0 text-blue-700" size={21} />
                            <div>
                                <h3 className="font-semibold text-slate-900">Attention to detail</h3>
                                <p className="mt-1 text-sm leading-6 text-slate-600">A thoughtful approach to each cleaning request.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock3 className="mt-1 shrink-0 text-blue-700" size={21} />
                            <div>
                                <h3 className="font-semibold text-slate-900">Scheduling flexibility</h3>
                                <p className="mt-1 text-sm leading-6 text-slate-600">Discuss one-time, recurring or event-based needs.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="mt-1 shrink-0 text-blue-700" size={21} />
                            <div>
                                <h3 className="font-semibold text-slate-900">Quality checks</h3>
                                <p className="mt-1 text-sm leading-6 text-slate-600">A process built around reviewing work and client feedback.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
                                    What we do
                                </p>
                                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                                    Services for your space
                                </h2>
                                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                                    Explore our cleaning and laundry options. The exact scope can
                                    be discussed when you submit a request.
                                </p>
                            </div>
                            <Link
                                href="/services"
                                className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
                            >
                                View all services <ArrowRight size={18} />
                            </Link>
                        </div>

                        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {servicesWithRatings.map((service: any) => (
                                <ServiceCard key={service.id} service={service} />
                            ))}
                        </div>
                    </div>
                </section>

                <section id="about" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
                        <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 p-8 sm:p-12">
                            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-white bg-blue-900 shadow-md">
                                <Image
                                    src="/images/logo/samb-logo.jpeg"
                                    alt="SAMB's Logo"
                                    fill
                                    loading="lazy"
                                    sizes="64px"
                                    className="object-cover"
                                />
                            </div>
                            <p className="mt-8 text-sm font-bold uppercase tracking-wider text-blue-700">
                                The SAMB&apos;s approach
                            </p>
                            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900">
                                Professional care, shaped around your needs.
                            </h2>
                            <p className="mt-5 leading-7 text-slate-600">
                                Every space and service request is different. We aim to
                                understand the work required, agree on the scope, and keep
                                communication clear throughout the process.
                            </p>
                        </div>

                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
                                Why choose us
                            </p>
                            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                                A service you can plan around
                            </h2>
                            <div className="mt-8 space-y-6">
                                {[
                                    ["Flexible service options", "Discuss the work and schedule that fit your property or event."],
                                    ["Clear communication", "Submit your requirements and let the team review the details with you."],
                                    ["Quality-focused process", "Service checks and client feedback help us review the work delivered."],
                                ].map(([title, description]) => (
                                    <div key={title} className="flex gap-4">
                                        <CheckCircle2 className="mt-1 shrink-0 text-blue-700" size={23} />
                                        <div>
                                            <h3 className="font-bold text-slate-900">{title}</h3>
                                            <p className="mt-1 leading-7 text-slate-600">{description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="contact" className="bg-[#031c43] px-4 py-16 text-white sm:px-6 lg:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-3xl font-extrabold">Ready to discuss your service needs?</h2>
                            <p className="mt-3 max-w-2xl leading-7 text-blue-100">
                                Create an account to submit a request. Our team can review the
                                details and discuss pricing and scheduling with you.
                            </p>
                        </div>
                        <Link
                            href="/register"
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-blue-800 hover:bg-blue-50"
                        >
                            Get started <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
