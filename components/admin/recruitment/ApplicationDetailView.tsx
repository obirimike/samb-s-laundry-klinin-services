"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  Save,
  History,
  Lock,
} from "lucide-react";
import FeedbackModal from "@/components/ui/FeedbackModal";
import { formatApplicationStatus } from "@/lib/recruitment";

export type StatusHistoryRecord = {
  id: string;
  previousStatus: string;
  newStatus: string;
  note: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export type DetailedApplication = {
  id: string;
  applicationReference: string;
  vacancyId: string | null;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  coverLetter: string | null;
  cvFileName: string;
  cvMimeType: string;
  cvFileSize: number;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  vacancy: {
    id: string;
    title: string;
    slug: string;
    department: string;
    location: string;
    employmentType: string;
    workArrangement: string;
    status: string;
  } | null;
  statusHistory: StatusHistoryRecord[];
};

export default function ApplicationDetailView({
  initialApplication,
}: {
  initialApplication: DetailedApplication;
}) {
  const [application, setApplication] = useState<DetailedApplication>(initialApplication);
  const [selectedStatus, setSelectedStatus] = useState(application.status);
  const [historyNote, setHistoryNote] = useState("");
  const [adminNotes, setAdminNotes] = useState(application.adminNotes || "");

  const [isPending, startTransition] = useTransition();
  const [isDownloadingCv, setIsDownloadingCv] = useState(false);
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    variant: "success",
    title: "",
    message: "",
  });

  const currentStatusMeta = formatApplicationStatus(application.status);

  // Status Change Submit
  const handleStatusUpdate = (e: FormEvent) => {
    e.preventDefault();

    if (selectedStatus === application.status && !historyNote.trim()) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/recruitment/applications/${application.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: selectedStatus,
              historyNote: historyNote.trim() || undefined,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          const msg =
            typeof data?.message === "string"
              ? data.message
              : "Unable to update application status.";
          setFeedback({
            isOpen: true,
            variant: "error",
            title: "Update Failed",
            message: msg,
          });
          return;
        }

        const updated = data?.data?.application || data?.application;
        if (updated) {
          setApplication(updated);
          setHistoryNote("");
          setFeedback({
            isOpen: true,
            variant: "success",
            title: "Status Updated",
            message: `Application moved to ${formatApplicationStatus(updated.status).label}.`,
          });
        }
      } catch {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Connection Error",
          message: "Failed to connect to the server.",
        });
      }
    });
  };

  // Admin Notes Save
  const handleSaveNotes = () => {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/recruitment/applications/${application.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adminNotes: adminNotes.trim(),
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setFeedback({
            isOpen: true,
            variant: "error",
            title: "Save Failed",
            message:
              typeof data?.message === "string"
                ? data.message
                : "Unable to save administrative notes.",
          });
          return;
        }

        setFeedback({
          isOpen: true,
          variant: "success",
          title: "Notes Saved",
          message: "Administrative notes updated successfully.",
        });
      } catch {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Connection Error",
          message: "Failed to save notes.",
        });
      }
    });
  };

  // Secure CV Retrieval
  const handleDownloadCv = async () => {
    setIsDownloadingCv(true);
    try {
      const response = await fetch(
        `/api/admin/recruitment/applications/${application.id}/cv`
      );

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Document Access Error",
          message:
            typeof data?.message === "string"
              ? data.message
              : "Unable to retrieve secure CV signed URL.",
        });
        return;
      }

      const signedUrl = data?.data?.signedUrl || data?.signedUrl;
      if (signedUrl) {
        // Open securely in new tab
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to communicate with storage service.",
      });
    } finally {
      setIsDownloadingCv(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/recruitment/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Applications</span>
        </Link>

        <span
          className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3.5 py-1 text-xs font-bold sm:self-auto ${currentStatusMeta.badgeStyle}`}
        >
          {currentStatusMeta.label}
        </span>
      </div>

      {/* Main Grid: Details + Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Candidate Info & Cover Letter (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Candidate Profile Card */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-5">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">
                  {application.applicationReference}
                </span>
                <h1 className="mt-1 text-2xl font-black text-slate-900">
                  {application.fullName}
                </h1>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Submitted on</span>
                <span className="text-xs font-bold text-slate-700">
                  {new Date(application.createdAt).toLocaleString("en-GH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3 text-xs">
              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <Mail size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-slate-400 font-semibold block">Email</span>
                  <a
                    href={`mailto:${application.email}`}
                    className="font-bold text-slate-900 hover:text-blue-700 truncate block mt-0.5"
                  >
                    {application.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <Phone size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-slate-400 font-semibold block">Phone</span>
                  <a
                    href={`tel:${application.phone}`}
                    className="font-bold text-slate-900 hover:text-blue-700 truncate block mt-0.5"
                  >
                    {application.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-slate-400 font-semibold block">Location</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {application.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Role */}
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Target Role
              </span>
              {application.vacancy ? (
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {application.vacancy.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Department: {application.vacancy.department} · {application.vacancy.location}
                    </p>
                  </div>
                  <Link
                    href={`/admin/recruitment/vacancies/${application.vacancy.id}/edit`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:underline"
                  >
                    <span>View Vacancy</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              ) : (
                <p className="mt-1 font-bold text-slate-900 text-sm">
                  General Application (No specific vacancy applied for)
                </p>
              )}
            </div>
          </section>

          {/* Secure CV Card */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-900">
                  <Lock size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Applicant CV Document</h2>
                  <p className="text-xs text-slate-400">
                    Stored in private Supabase bucket. Signed URLs expire after 15 minutes.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                <ShieldCheck size={12} className="text-emerald-600" />
                Admin Only
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-200 text-blue-800">
                  <FileText size={26} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900 text-sm">
                    {application.cvFileName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(application.cvFileSize / 1024).toFixed(1)} KB · {application.cvMimeType}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isDownloadingCv}
                onClick={handleDownloadCv}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#031c43] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-900 disabled:opacity-50 transition"
              >
                {isDownloadingCv ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Preview / Download CV</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Cover Letter */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-base font-bold text-slate-900">Cover Letter &amp; Introduction</h2>
            <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-700 border border-slate-100 font-sans">
              {application.coverLetter || "No cover letter provided."}
            </div>
          </section>

          {/* Decision Timeline History */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <History size={18} className="text-slate-500" />
              <h2 className="text-base font-bold text-slate-900">Status History Audit Trail</h2>
            </div>

            {application.statusHistory.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                No status changes recorded yet. Application is at its initial submission stage.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {application.statusHistory.map((item) => (
                  <div
                    key={item.id}
                    className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200 last:before:hidden"
                  >
                    <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-sm" />
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {formatApplicationStatus(item.previousStatus).label} →{" "}
                          {formatApplicationStatus(item.newStatus).label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.createdAt).toLocaleString("en-GH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Updated by: {item.actor.name || item.actor.email || "System Admin"}
                      </p>

                      {item.note && (
                        <p className="mt-2 text-xs italic text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                          &ldquo;{item.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Status Change & Administrative Notes (1 col) */}
        <div className="space-y-6">
          {/* Status Change Form */}
          <form
            onSubmit={handleStatusUpdate}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="font-bold text-slate-900 text-base">Update Status</h2>
            <p className="mt-1 text-xs text-slate-500">
              Moving status updates the applicant tracking timeline and audit records.
            </p>

            <div className="mt-4">
              <label htmlFor="statusSelect" className="block text-xs font-semibold text-slate-700">
                New Status
              </label>
              <select
                id="statusSelect"
                disabled={isPending}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="SUBMITTED">Submitted (Initial Queue)</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEW">Interview Scheduled</option>
                <option value="APPROVED">Approved / Offer Extended</option>
                <option value="REJECTED">Not Selected</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>

            <div className="mt-4">
              <label htmlFor="historyNote" className="block text-xs font-semibold text-slate-700">
                Decision Note / Reason (Optional)
              </label>
              <textarea
                id="historyNote"
                rows={3}
                disabled={isPending}
                value={historyNote}
                onChange={(e) => setHistoryNote(e.target.value)}
                placeholder="e.g. Cleared phone screening, invite for on-site trial on Thursday..."
                className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="mt-5">
              <button
                type="submit"
                disabled={isPending || selectedStatus === application.status}
                className="w-full rounded-xl bg-[#031c43] py-2.5 text-xs font-bold text-white shadow hover:bg-blue-900 disabled:opacity-40 transition"
              >
                {isPending ? "Updating..." : "Commit Status Change"}
              </button>
            </div>
          </form>

          {/* Administrative Internal Notes */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-base">Internal Notes</h2>
              <span className="text-[11px] font-semibold text-slate-400">Private</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Only visible to authorized administrators. Not visible to the candidate.
            </p>

            <textarea
              rows={5}
              disabled={isPending}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Candidate interview feedback, salary expectations, reference checks..."
              className="mt-3 block w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />

            <div className="mt-4">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveNotes}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <Save size={14} />
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
