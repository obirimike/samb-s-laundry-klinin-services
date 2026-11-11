"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  FileText,
  ArrowRight,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatApplicationStatus } from "@/lib/recruitment";

export type AdminApplicationRecord = {
  id: string;
  applicationReference: string;
  vacancyId: string | null;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  cvFileName: string;
  cvFileSize: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  vacancy: {
    id: string;
    title: string;
    department: string;
  } | null;
};

export type VacancyOption = {
  id: string;
  title: string;
  department: string;
};

type ApplicationListManagerProps = {
  initialApplications: AdminApplicationRecord[];
  vacancies: VacancyOption[];
};

export default function ApplicationListManager({
  initialApplications,
  vacancies,
}: ApplicationListManagerProps) {
  const searchParams = useSearchParams();
  const initialVacancyFilter = searchParams.get("vacancyId") || "ALL";

  const [applications] = useState<AdminApplicationRecord[]>(initialApplications);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedVacancy, setSelectedVacancy] = useState(initialVacancyFilter);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (selectedStatus !== "ALL" && app.status !== selectedStatus) {
        return false;
      }
      // Vacancy filter
      if (selectedVacancy === "GENERAL") {
        if (app.vacancyId !== null) return false;
      } else if (selectedVacancy !== "ALL") {
        if (app.vacancyId !== selectedVacancy) return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matches =
          app.applicationReference.toLowerCase().includes(q) ||
          app.fullName.toLowerCase().includes(q) ||
          app.email.toLowerCase().includes(q) ||
          app.phone.toLowerCase().includes(q) ||
          app.location.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [applications, selectedStatus, selectedVacancy, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Candidate Applications
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Review candidate qualifications, cover letters, and securely access applicant CVs.
          </p>
        </div>

        <Link
          href="/admin/recruitment/vacancies"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <Briefcase size={14} />
          <span>Manage Vacancies</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search candidate name, email, phone, reference..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW">Interview</option>
              <option value="APPROVED">Approved / Offer</option>
              <option value="REJECTED">Not Selected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>

          {/* Vacancy Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Opening:</span>
            <select
              value={selectedVacancy}
              onChange={(e) => {
                setSelectedVacancy(e.target.value);
                setPage(1);
              }}
              className="max-w-[200px] truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">All Applications</option>
              <option value="GENERAL">General Application</option>
              {vacancies.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} ({v.department})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          <Users size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">No applications match criteria</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search terms or filter selections.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Reference &amp; Candidate</th>
                  <th className="px-5 py-3.5">Position / Role</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">CV File</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Submitted</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pagedItems.map((app) => {
                  const statusMeta = formatApplicationStatus(app.status);

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-slate-500 block text-[11px]">
                          {app.applicationReference}
                        </span>
                        <span className="font-bold text-slate-900 block text-sm mt-0.5">
                          {app.fullName}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {app.email} · {app.phone}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {app.vacancy ? (
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {app.vacancy.title}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {app.vacancy.department}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                            General Pool
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {app.location}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 truncate max-w-[140px]">
                          <FileText size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{app.cvFileName}</span>
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {(app.cvFileSize / 1024).toFixed(0)} KB
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusMeta.badgeStyle}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500 text-[11px]">
                        {new Date(app.createdAt).toLocaleDateString("en-GH", {
                          dateStyle: "medium",
                        })}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/recruitment/applications/${app.id}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-[#031c43] hover:text-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition"
                        >
                          <span>Review</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-xs text-slate-500">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} applications
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
