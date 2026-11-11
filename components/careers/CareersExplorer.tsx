"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Briefcase,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
} from "lucide-react";
import {
  formatEmploymentType,
  formatWorkArrangement,
} from "@/lib/recruitment";

export type PublicVacancyCard = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  workArrangement: string;
  openings: number;
  deadline: string | null;
  createdAt: string;
};

export default function CareersExplorer({
  vacancies,
}: {
  vacancies: PublicVacancyCard[];
}) {
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");

  const departments = useMemo(() => {
    const set = new Set<string>();
    vacancies.forEach((v) => {
      if (v.department) set.add(v.department);
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [vacancies]);

  const filteredVacancies = useMemo(() => {
    return vacancies.filter((v) => {
      const matchesDept =
        selectedDepartment === "ALL" || v.department === selectedDepartment;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.department.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [vacancies, search, selectedDepartment]);

  return (
    <div className="space-y-8">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, department, or city..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>

        {/* Department Quick Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDepartment(dept)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                selectedDepartment === dept
                  ? "bg-[#031c43] text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {dept === "ALL" ? "All Roles" : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Vacancies Grid */}
      {filteredVacancies.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
            <Briefcase size={26} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            {vacancies.length === 0
              ? "No vacancies currently open"
              : "No positions match your search"}
          </h3>
          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
            {vacancies.length === 0
              ? "We don't have active vacancy listings at the moment, but we are always eager to meet motivated workers."
              : "Try adjusting your search criteria or explore submitting a general application."}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/careers/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-[#031c43] px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-900 transition"
            >
              <span>Submit General Application</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredVacancies.map((vacancy) => {
            const hasDeadline = Boolean(vacancy.deadline);
            const deadlineDate = vacancy.deadline
              ? new Date(vacancy.deadline)
              : null;

            return (
              <article
                key={vacancy.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-lg sm:p-8"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                      <Building2 size={12} />
                      {vacancy.department}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <Briefcase size={12} />
                      {formatEmploymentType(vacancy.employmentType)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {formatWorkArrangement(vacancy.workArrangement)}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-900 transition">
                    <Link href={`/careers/${vacancy.slug}`}>
                      {vacancy.title}
                    </Link>
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      {vacancy.location}
                    </span>
                    {vacancy.openings > 1 && (
                      <span className="inline-flex items-center gap-1">
                        <Sparkles size={13} className="text-amber-500" />
                        {vacancy.openings} Openings
                      </span>
                    )}
                    {hasDeadline && deadlineDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        Deadline:{" "}
                        {deadlineDate.toLocaleDateString("en-GH", {
                          dateStyle: "medium",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                  <Link
                    href={`/careers/${vacancy.slug}`}
                    className="text-xs font-semibold text-slate-600 hover:text-blue-700 transition"
                  >
                    View Details
                  </Link>

                  <Link
                    href={`/careers/${vacancy.slug}/apply`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#031c43] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-900 transition"
                  >
                    <span>Apply Now</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
