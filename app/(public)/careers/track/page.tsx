import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import ApplicationTracker from "@/components/careers/ApplicationTracker";
import { ArrowLeft, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Track Application Status | SAMB Careers",
  description:
    "Check the status of your submitted job application with SAMB's Laundry & Klinin Services using your reference number and email.",
};

export default function TrackApplicationPage() {
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
            <span>Back to Careers Portal</span>
          </Link>
          <Link
            href="/careers/apply"
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Submit New Application →
          </Link>
        </div>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
            <Search size={13} />
            <span>Application Verification</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Track Your Application
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Follow the progress of your application from initial submission through review, shortlisting, and interview stages.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-900 border-t-transparent" />
              <p className="mt-3 text-xs text-slate-500">Loading tracker...</p>
            </div>
          }
        >
          <ApplicationTracker />
        </Suspense>
      </div>
    </main>
  );
}
