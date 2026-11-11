import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  formatEmploymentType,
  formatWorkArrangement,
} from "@/lib/recruitment";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const vacancy = await db.vacancy.findUnique({
    where: { slug },
    select: { title: true, department: true, location: true, description: true },
  });

  if (!vacancy) {
    return {
      title: "Position Not Found | SAMB Careers",
    };
  }

  return {
    title: `${vacancy.title} (${vacancy.department}) | SAMB Careers`,
    description: `${vacancy.title} in ${vacancy.location} at SAMB Laundry & Klinin Services. ${vacancy.description.slice(0, 150)}...`,
  };
}

export default async function VacancyDetailPage({ params }: RouteProps) {
  const { slug } = await params;

  const vacancy = await db.vacancy.findUnique({
    where: { slug },
  });

  if (!vacancy || vacancy.status !== "PUBLISHED") {
    notFound();
  }

  const isExpired = vacancy.deadline ? new Date(vacancy.deadline) < new Date() : false;
  const deadlineFormatted = vacancy.deadline
    ? new Date(vacancy.deadline).toLocaleDateString("en-GH", {
        dateStyle: "full",
      })
    : "Open until filled";

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition"
          >
            <ArrowLeft size={14} />
            <span>Back to All Openings</span>
          </Link>
        </div>

        {/* Header Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-900">
              <Building2 size={13} />
              {vacancy.department}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700">
              <Briefcase size={13} />
              {formatEmploymentType(vacancy.employmentType)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700">
              {formatWorkArrangement(vacancy.workArrangement)}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {vacancy.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={16} className="text-slate-400" />
              {vacancy.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={16} className="text-slate-400" />
              Deadline: {deadlineFormatted}
            </span>
            {vacancy.openings > 1 && (
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
                <Sparkles size={16} />
                {vacancy.openings} Openings
              </span>
            )}
          </div>

          {/* Action Row */}
          <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            {isExpired ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                <AlertTriangle size={18} />
                <span>Applications for this role have closed.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock size={14} />
                <span>Applications are currently being reviewed on a rolling basis.</span>
              </div>
            )}

            {!isExpired ? (
              <Link
                href={`/careers/${vacancy.slug}/apply`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#031c43] px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-900 transition"
              >
                <span>Apply for this Position</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                href="/careers/apply"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <span>Submit General Application</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {/* Job Content */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Main Content (2 cols) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Description */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">Role Overview</h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {vacancy.description}
              </div>
            </section>

            {/* Responsibilities */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">Key Responsibilities</h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {vacancy.responsibilities}
              </div>
            </section>

            {/* Requirements */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">Qualifications &amp; Requirements</h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {vacancy.requirements}
              </div>
            </section>

            {/* Skills */}
            {vacancy.skills && vacancy.skills.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-bold text-slate-900">Skills &amp; Competencies</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {vacancy.skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-medium text-slate-700"
                    >
                      <CheckCircle2 size={13} className="text-blue-600" />
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar (1 col) */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">Summary</h3>
              <dl className="mt-4 space-y-3 text-xs">
                <div>
                  <dt className="text-slate-400">Department</dt>
                  <dd className="font-semibold text-slate-800">{vacancy.department}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Employment Type</dt>
                  <dd className="font-semibold text-slate-800">
                    {formatEmploymentType(vacancy.employmentType)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Work Arrangement</dt>
                  <dd className="font-semibold text-slate-800">
                    {formatWorkArrangement(vacancy.workArrangement)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Location</dt>
                  <dd className="font-semibold text-slate-800">{vacancy.location}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Application Deadline</dt>
                  <dd className="font-semibold text-slate-800">{deadlineFormatted}</dd>
                </div>
              </dl>

              <div className="mt-6 border-t border-slate-100 pt-5">
                {!isExpired ? (
                  <Link
                    href={`/careers/${vacancy.slug}/apply`}
                    className="block w-full text-center rounded-xl bg-[#031c43] py-3 text-xs font-bold text-white shadow hover:bg-blue-900 transition"
                  >
                    Apply Now
                  </Link>
                ) : (
                  <p className="text-center text-xs font-semibold text-amber-700">
                    Applications Closed
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6">
              <h3 className="font-bold text-slate-900 text-sm">Need Help?</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Have questions about this role or our recruitment process? Feel free to contact our recruitment team at{" "}
                <a href="mailto:info@sambsklining.com" className="font-semibold text-blue-700 hover:underline">
                  info@sambsklining.com
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
