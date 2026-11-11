import type { Metadata } from "next";
import Link from "next/link";
import CareersApplicationForm from "@/components/careers/CareersApplicationForm";
import { ArrowLeft, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "General Job Application | SAMB Careers",
  description:
    "Submit your resume to the SAMB Laundry & Klinin Services recruitment portal. We review general applications for emerging operations, customer service, and field positions.",
};

export default function GeneralApplicationPage() {
  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition"
          >
            <ArrowLeft size={14} />
            <span>Back to All Openings</span>
          </Link>
          <Link
            href="/careers/track"
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Track Existing Application →
          </Link>
        </div>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
            <Sparkles size={13} />
            <span>General Application</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Join the SAMB&apos;s Team
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Don&apos;t see an exact job vacancy matching your skills right now? Submit your resume below.
            We actively review general submissions for upcoming contracts, expansion projects, and seasonal staffing needs.
          </p>
        </div>

        <CareersApplicationForm vacancy={null} isGeneral={true} />
      </div>
    </main>
  );
}
