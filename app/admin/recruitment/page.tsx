import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Briefcase,
  Users,
  Calendar,
  Plus,
  ArrowRight,
  Clock,
  ExternalLink,
} from "lucide-react";
import { formatApplicationStatus } from "@/lib/recruitment";

export const dynamic = "force-dynamic";

export default async function AdminRecruitmentOverviewPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  // Fetch aggregated statistics in parallel
  const [
    totalApplications,
    submittedCount,
    underReviewCount,
    shortlistedCount,
    interviewCount,
    approvedCount,
    totalVacancies,
    openVacancies,
    recentApplications,
  ] = await Promise.all([
    db.jobApplication.count(),
    db.jobApplication.count({ where: { status: "SUBMITTED" } }),
    db.jobApplication.count({ where: { status: "UNDER_REVIEW" } }),
    db.jobApplication.count({ where: { status: "SHORTLISTED" } }),
    db.jobApplication.count({ where: { status: "INTERVIEW" } }),
    db.jobApplication.count({ where: { status: "APPROVED" } }),
    db.vacancy.count(),
    db.vacancy.count({
      where: {
        status: "PUBLISHED",
        OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
      },
    }),
    db.jobApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        vacancy: {
          select: { title: true, department: true },
        },
      },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Recruitment Portal
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage job vacancies, track candidate applications, and review applicant CVs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/careers"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <span>Public Careers Portal</span>
            <ExternalLink size={13} />
          </Link>
          <Link
            href="/admin/recruitment/vacancies/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#031c43] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-900 transition"
          >
            <Plus size={15} />
            <span>Create Vacancy</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Applications */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Applications
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-800">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{totalApplications}</p>
          <p className="mt-1 text-xs text-slate-500">
            Across active listings &amp; general pool
          </p>
        </div>

        {/* Needs Review */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              New Submissions
            </span>
            <div className="rounded-xl bg-blue-100 p-2 text-blue-900">
              <Clock size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-blue-950">{submittedCount}</p>
          <p className="mt-1 text-xs text-blue-700">Pending initial screening</p>
        </div>

        {/* Pipeline Active */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              In Interview Pipeline
            </span>
            <div className="rounded-xl bg-purple-100 p-2 text-purple-900">
              <Calendar size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-purple-950">{interviewCount}</p>
          <p className="mt-1 text-xs text-purple-700">
            {shortlistedCount} shortlisted candidates
          </p>
        </div>

        {/* Open Vacancies */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Vacancies
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-800">
              <Briefcase size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{openVacancies}</p>
          <p className="mt-1 text-xs text-slate-500">
            {totalVacancies} total vacancies configured
          </p>
        </div>
      </div>

      {/* Quick Action Hubs */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/admin/recruitment/applications"
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-900 group-hover:bg-[#031c43] group-hover:text-white transition">
              <Users size={24} />
            </div>
            <ArrowRight
              size={18}
              className="text-slate-400 group-hover:translate-x-1 group-hover:text-blue-900 transition"
            />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-900">Manage Applications</h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Filter, search, and review candidate submissions. Update application status, record internal notes, and download applicant CVs.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-800">
              {submittedCount} Submitted
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-800">
              {underReviewCount} Under Review
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800">
              {approvedCount} Approved
            </span>
          </div>
        </Link>

        <Link
          href="/admin/recruitment/vacancies"
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-800 group-hover:bg-[#031c43] group-hover:text-white transition">
              <Briefcase size={24} />
            </div>
            <ArrowRight
              size={18}
              className="text-slate-400 group-hover:translate-x-1 group-hover:text-blue-900 transition"
            />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-900">Manage Vacancies</h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Create, edit, publish, and close job postings. Control application deadlines, job descriptions, and qualification requirements.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800">
              {openVacancies} Published &amp; Open
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
              {totalVacancies - openVacancies} Draft / Closed
            </span>
          </div>
        </Link>
      </div>

      {/* Recent Applications Feed */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
            <p className="text-xs text-slate-500">Latest candidate submissions</p>
          </div>
          <Link
            href="/admin/recruitment/applications"
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            View All ({totalApplications}) →
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No applications submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentApplications.map((app: any) => {
              const statusMeta = formatApplicationStatus(app.status);

              return (
                <div
                  key={app.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {app.applicationReference}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta.badgeStyle}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <p className="mt-1 font-bold text-slate-900 text-sm">
                      {app.fullName}
                    </p>

                    <p className="text-xs text-slate-500">
                      {app.vacancy ? app.vacancy.title : "General Application"} ·{" "}
                      {app.location} · {app.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {new Date(app.createdAt).toLocaleDateString("en-GH", {
                        dateStyle: "medium",
                      })}
                    </span>
                    <Link
                      href={`/admin/recruitment/applications/${app.id}`}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
