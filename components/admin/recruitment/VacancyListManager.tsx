"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Building2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";
import {
  formatEmploymentType,
  formatWorkArrangement,
} from "@/lib/recruitment";

export type AdminVacancyRecord = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  workArrangement: string;
  openings: number;
  deadline: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  createdAt: string;
  _count: {
    applications: number;
  };
};

type FilterStatus = "ALL" | "PUBLISHED" | "DRAFT" | "CLOSED" | "ARCHIVED";

export default function VacancyListManager({
  initialVacancies,
}: {
  initialVacancies: AdminVacancyRecord[];
}) {
  const [vacancies, setVacancies] = useState<AdminVacancyRecord[]>(initialVacancies);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminVacancyRecord | null>(null);

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

  const counts = useMemo(
    () => ({
      ALL: vacancies.length,
      PUBLISHED: vacancies.filter((v) => v.status === "PUBLISHED").length,
      DRAFT: vacancies.filter((v) => v.status === "DRAFT").length,
      CLOSED: vacancies.filter((v) => v.status === "CLOSED").length,
      ARCHIVED: vacancies.filter((v) => v.status === "ARCHIVED").length,
    }),
    [vacancies]
  );

  const filtered = useMemo(() => {
    return vacancies.filter((v) => {
      const matchStatus = filter === "ALL" || v.status === filter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.department.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [vacancies, filter, search]);

  async function executeDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setBusyId(id);

    try {
      const response = await fetch(`/api/admin/recruitment/vacancies/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteTarget(null);
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Deletion Prevented",
          message:
            typeof data?.message === "string"
              ? data.message
              : "Unable to delete vacancy.",
        });
        return;
      }

      setVacancies((prev) => prev.filter((v) => v.id !== id));
      setDeleteTarget(null);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Vacancy Deleted",
        message: "The vacancy was permanently removed.",
      });
    } catch {
      setDeleteTarget(null);
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to connect to the server.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Vacancies Manager
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Publish, edit, and control recruitment openings across departments.
          </p>
        </div>

        <Link
          href="/admin/recruitment/vacancies/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#031c43] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-900 transition"
        >
          <Plus size={15} />
          <span>Post New Vacancy</span>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PUBLISHED", "DRAFT", "CLOSED", "ARCHIVED"] as FilterStatus[]).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  filter === status
                    ? "bg-[#031c43] text-white shadow"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {status === "ALL" ? "All Vacancies" : status} ({counts[status]})
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vacancies..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Vacancies List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          <Briefcase size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">No vacancies found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {vacancies.length === 0
              ? "You haven't posted any vacancies yet. Click 'Post New Vacancy' to get started."
              : "No vacancies match your current filter and search."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => {
            const hasDeadline = Boolean(item.deadline);
            const isExpired =
              hasDeadline && item.deadline ? new Date(item.deadline) < new Date() : false;

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "DRAFT"
                              ? "bg-slate-100 text-slate-700"
                              : item.status === "CLOSED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.status}
                      </span>
                      {isExpired && item.status === "PUBLISHED" && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Deadline Passed
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <Building2 size={12} />
                        {item.department}
                      </span>
                      <span>·</span>
                      <span>{item.location}</span>
                      <span>·</span>
                      <span>{formatEmploymentType(item.employmentType)}</span>
                      <span>·</span>
                      <span>{formatWorkArrangement(item.workArrangement)}</span>
                      {item.deadline && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={12} />
                            Deadline:{" "}
                            {new Date(item.deadline).toLocaleDateString("en-GH", {
                              dateStyle: "medium",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                    <Link
                      href={`/admin/recruitment/applications?vacancyId=${item.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition"
                      title="View applications for this role"
                    >
                      <Users size={13} />
                      <span>{item._count.applications} Applicants</span>
                    </Link>

                    {item.status === "PUBLISHED" && (
                      <Link
                        href={`/careers/${item.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        title="View on public careers portal"
                      >
                        <ExternalLink size={13} />
                        <span className="hidden sm:inline">Preview</span>
                      </Link>
                    )}

                    <Link
                      href={`/admin/recruitment/vacancies/${item.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Edit size={13} />
                      <span>Edit</span>
                    </Link>

                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => setDeleteTarget(item)}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Delete Vacancy */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={executeDelete}
          title="Delete Vacancy?"
          description={`Are you sure you want to delete "${deleteTarget.title}"?`}
          consequences={
            deleteTarget._count.applications > 0
              ? `Warning: This vacancy has ${deleteTarget._count.applications} application(s). Deletion will be rejected by database constraints.`
              : "This vacancy will be permanently deleted from the database."
          }
          confirmText="Delete Vacancy"
          isDestructive={true}
          isLoading={busyId === deleteTarget.id}
        />
      )}

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
