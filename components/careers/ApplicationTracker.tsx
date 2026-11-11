"use client";

import { useState, useEffect, useTransition, useCallback, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  AlertCircle,
  Clock,
  Briefcase,
  Calendar,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

type TrackResult = {
  referenceNumber: string;
  appliedRole: string;
  department: string;
  location: string;
  status: string;
  statusLabel: string;
  statusBadgeStyle: string;
  statusExplanation: string;
  submittedAt: string;
  updatedAt: string;
};

export default function ApplicationTracker() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";
  const initialEmail = searchParams.get("email") || "";

  const [referenceNumber, setReferenceNumber] = useState(initialRef);
  const [email, setEmail] = useState(initialEmail);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLookup = useCallback((refToLookup: string, emailToLookup: string) => {
    setError(null);
    setResult(null);

    if (!refToLookup.trim()) {
      setError("Please enter your application reference number.");
      return;
    }
    if (!emailToLookup.trim()) {
      setError("Please enter the email address used during application.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/careers/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referenceNumber: refToLookup.trim(),
            email: emailToLookup.trim().toLowerCase(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(
            typeof data?.message === "string"
              ? data.message
              : "Unable to find an application matching those details."
          );
          return;
        }

        const appData = data?.data?.application || data?.application;
        if (appData) {
          setResult(appData);
        } else {
          setError("Received invalid response from recruitment service.");
        }
      } catch {
        setError("Network connection error. Please try again.");
      }
    });
  }, []);

  // If both parameters exist on mount, query status on load
  useEffect(() => {
    if (!initialRef || !initialEmail) return;

    let isSubscribed = true;
    fetch("/api/careers/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referenceNumber: initialRef.trim(),
        email: initialEmail.trim().toLowerCase(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isSubscribed) return;
        if (data?.success && data?.data?.application) {
          setResult(data.data.application);
        } else if (data?.success && data?.application) {
          setResult(data.application);
        } else {
          setError(
            typeof data?.message === "string"
              ? data.message
              : "Unable to find an application matching those details."
          );
        }
      })
      .catch(() => {
        if (!isSubscribed) return;
        setError("Network connection error. Please try again.");
      });

    return () => {
      isSubscribed = false;
    };
  }, [initialRef, initialEmail]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleLookup(referenceNumber, email);
  };

  return (
    <div className="space-y-8">
      {/* Search Card */}
      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10"
      >
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Check Your Application Status
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter your unique application reference number and applicant email address to view real-time updates.
        </p>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="min-w-0 flex-1">{error}</p>
          </div>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="referenceNumber"
              className="block text-sm font-semibold text-slate-900"
            >
              Application Reference Number
            </label>
            <input
              id="referenceNumber"
              type="text"
              required
              disabled={isPending}
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. SAMB-APP-202611-9F2B"
              className="mt-2 block w-full uppercase font-mono rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 placeholder:normal-case focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-slate-900"
            >
              Applicant Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={isPending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="The email used on your application"
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#031c43] px-8 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-blue-900 disabled:opacity-50 transition"
          >
            {isPending ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Checking Status...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Find Application</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results View */}
      {result && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Application Reference
              </p>
              <h3 className="font-mono text-2xl font-extrabold text-[#031c43]">
                {result.referenceNumber}
              </h3>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 self-start rounded-full border px-4 py-1.5 text-xs font-bold sm:self-auto ${result.statusBadgeStyle}`}
            >
              {result.statusLabel}
            </span>
          </div>

          {/* Details Grid */}
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Briefcase size={14} />
                Applied Position
              </span>
              <p className="mt-2 font-bold text-slate-900">{result.appliedRole}</p>
              <p className="text-xs text-slate-500">{result.department}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Calendar size={14} />
                Date Submitted
              </span>
              <p className="mt-2 font-bold text-slate-900">
                {new Date(result.submittedAt).toLocaleDateString("en-GH", {
                  dateStyle: "medium",
                })}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(result.submittedAt).toLocaleTimeString("en-GH", {
                  timeStyle: "short",
                })}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Clock size={14} />
                Last Updated
              </span>
              <p className="mt-2 font-bold text-slate-900">
                {new Date(result.updatedAt).toLocaleDateString("en-GH", {
                  dateStyle: "medium",
                })}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(result.updatedAt).toLocaleTimeString("en-GH", {
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>

          {/* Status Explanation Box */}
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-100 p-2 text-blue-900 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Status Explanation</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  {result.statusExplanation}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-500">
              Need assistance? Email us at{" "}
              <a
                href="mailto:info@sambsklining.com"
                className="font-semibold text-blue-700 hover:underline"
              >
                info@sambsklining.com
              </a>{" "}
              referencing your code.
            </p>

            <Link
              href="/careers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:text-blue-950 transition"
            >
              <span>Explore other vacancies</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
