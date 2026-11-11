import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import CareersExplorer from "@/components/careers/CareersExplorer";
import {
  Sparkles,
  ShieldCheck,
  Users,
  Search,
  ArrowRight,
  HeartHandshake,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Careers & Opportunities | SAMB Laundry & Klinin Services",
  description:
    "Join our dedicated team at SAMB's Laundry & Klinin Services. Discover open vacancies and career pathways across cleaning operations, logistics, and management.",
};

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  let vacancies: Array<{
    id: string;
    title: string;
    slug: string;
    department: string;
    location: string;
    employmentType: string;
    workArrangement: string;
    openings: number;
    deadline: Date | null;
    createdAt: Date;
  }> = [];

  try {
    vacancies = await db.vacancy.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
      },
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        department: true,
        location: true,
        employmentType: true,
        workArrangement: true,
        openings: true,
        deadline: true,
        createdAt: true,
      },
    });
  } catch (err) {
    console.warn("Could not query vacancies (tables may need migration):", err);
  }

  const serializedVacancies = vacancies.map((v) => ({
    ...v,
    deadline: v.deadline ? v.deadline.toISOString() : null,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <main className="bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <section className="bg-[#031c43] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-200 backdrop-blur-sm border border-blue-400/30">
              <Sparkles size={13} />
              <span>Join Our Growing Team</span>
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Join the SAMB&apos;s Team
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              We take pride in setting the standard for professional cleaning, laundry and pest controlling services in Ghana.
              Join a team where integrity, dedication, team-work and mutual respect come first.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/careers/apply"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#031c43] shadow-lg hover:bg-slate-100 transition"
              >
                <span>Submit General Application</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/careers/track"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition"
              >
                <Search size={16} />
                <span>Track Existing Application</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid gap-8 sm:grid-cols-3">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-900 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Team Collaboration</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Transparent expectations, supportive management, and a culture that values everyday dedication.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800 shrink-0">
              <HeartHandshake size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Skill Development</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Continuous training on professional cleaning technologies, hygiene standards, and customer care.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-800 shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Career Advancement</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                We prioritize promoting internal leaders into supervisory, administrative, and operations roles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Vacancies Explorer */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Open Positions
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Explore available vacancies across our service teams and administrative operations.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing {vacancies.length} published {vacancies.length === 1 ? "opening" : "openings"}
          </span>
        </div>

        <CareersExplorer vacancies={serializedVacancies} />

        {/* General Application Call-to-action Banner */}
        <div className="mt-16 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-900 to-[#031c43] p-8 text-white shadow-xl sm:p-12">
          <div className="max-w-2xl">
            <span className="rounded-full bg-blue-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-200">
              Don&apos;t see your role?
            </span>
            <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
              We&apos;re always interested in meeting great workers
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-blue-100">
              Whether you are an experienced cleaning supervisor, laundry technician, pest control specialist, customer care specialist, or operational assistant, send us your resume. We frequently review general applications as new contracts begin.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/careers/apply"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#031c43] shadow hover:bg-slate-100 transition"
              >
                <span>Submit General Application</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/careers/track"
                className="text-xs font-semibold text-blue-200 hover:text-white underline underline-offset-4 transition"
              >
                Already applied? Track your reference number →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
