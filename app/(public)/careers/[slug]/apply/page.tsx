import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import CareersApplicationForm from "@/components/careers/CareersApplicationForm";
import { ArrowLeft, AlertTriangle, ArrowRight } from "lucide-react";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const vacancy = await db.vacancy.findUnique({
    where: { slug },
    select: { title: true },
  });

  if (!vacancy) {
    return {
      title: "Apply | SAMB Careers",
    };
  }

  return {
    title: `Apply: ${vacancy.title} | SAMB Careers`,
    description: `Submit your job application for ${vacancy.title} at SAMB Laundry & Klinin Services.`,
  };
}

export default async function VacancyApplyPage({ params }: RouteProps) {
  const { slug } = await params;

  const vacancy = await db.vacancy.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      department: true,
      location: true,
      employmentType: true,
      status: true,
      deadline: true,
    },
  });

  if (!vacancy || vacancy.status !== "PUBLISHED") {
    notFound();
  }

  const isExpired = vacancy.deadline ? new Date(vacancy.deadline) < new Date() : false;

  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/careers/${vacancy.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Role Details</span>
          </Link>
          <Link
            href="/careers/track"
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Track Existing Application →
          </Link>
        </div>

        {isExpired ? (
          <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <AlertTriangle size={28} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Applications for this role have closed
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              The application deadline for <strong>{vacancy.title}</strong> has passed and we are no longer accepting new submissions for this specific opening.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/careers/apply"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#031c43] px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-900 transition"
              >
                <span>Submit General Application</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/careers"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Explore Other Roles
              </Link>
            </div>
          </div>
        ) : (
          <CareersApplicationForm vacancy={vacancy} isGeneral={false} />
        )}
      </div>
    </main>
  );
}
