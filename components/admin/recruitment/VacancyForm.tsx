"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import FeedbackModal from "@/components/ui/FeedbackModal";

export type VacancyInitialData = {
  id?: string;
  title: string;
  department: string;
  location: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY" | "CASUAL";
  workArrangement: "ON_SITE" | "HYBRID" | "REMOTE";
  description: string;
  responsibilities: string;
  requirements: string;
  skills: string[];
  openings: number;
  deadline: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
};

type VacancyFormProps = {
  initialData?: VacancyInitialData;
  mode: "create" | "edit";
};

export default function VacancyForm({ initialData, mode }: VacancyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title || "");
  const [department, setDepartment] = useState(initialData?.department || "Cleaning Operations");
  const [location, setLocation] = useState(initialData?.location || "Accra, Ghana");
  const [employmentType, setEmploymentType] = useState<VacancyInitialData["employmentType"]>(
    initialData?.employmentType || "FULL_TIME"
  );
  const [workArrangement, setWorkArrangement] = useState<VacancyInitialData["workArrangement"]>(
    initialData?.workArrangement || "ON_SITE"
  );
  const [openings, setOpenings] = useState(initialData?.openings || 1);
  const [deadline, setDeadline] = useState(
    initialData?.deadline
      ? new Date(initialData.deadline).toISOString().split("T")[0]
      : ""
  );
  const [status, setStatus] = useState<VacancyInitialData["status"]>(
    initialData?.status || "DRAFT"
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [responsibilities, setResponsibilities] = useState(initialData?.responsibilities || "");
  const [requirements, setRequirements] = useState(initialData?.requirements || "");
  const [skillsInput, setSkillsInput] = useState(initialData?.skills?.join(", ") || "");

  const [error, setError] = useState<string | null>(null);
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim() || title.trim().length < 3) {
      setError("Job title must be at least 3 characters.");
      return;
    }
    if (!department.trim()) {
      setError("Department is required.");
      return;
    }
    if (!location.trim()) {
      setError("Location is required.");
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setError("Job description must be at least 20 characters.");
      return;
    }
    if (!responsibilities.trim() || responsibilities.trim().length < 10) {
      setError("Key responsibilities must be at least 10 characters.");
      return;
    }
    if (!requirements.trim() || requirements.trim().length < 10) {
      setError("Qualifications & requirements must be at least 10 characters.");
      return;
    }

    const skillsArray = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      employmentType,
      workArrangement,
      openings: Number(openings),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status,
      description: description.trim(),
      responsibilities: responsibilities.trim(),
      requirements: requirements.trim(),
      skills: skillsArray,
    };

    startTransition(async () => {
      try {
        const url =
          mode === "create"
            ? "/api/admin/recruitment/vacancies"
            : `/api/admin/recruitment/vacancies/${initialData?.id}`;
        const method = mode === "create" ? "POST" : "PATCH";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          const msg = typeof data?.message === "string" ? data.message : "Failed to save vacancy.";
          setError(msg);
          setFeedback({
            isOpen: true,
            variant: "error",
            title: "Save Failed",
            message: msg,
          });
          return;
        }

        setFeedback({
          isOpen: true,
          variant: "success",
          title: mode === "create" ? "Vacancy Created" : "Vacancy Updated",
          message:
            mode === "create"
              ? "The new vacancy has been successfully created."
              : "Vacancy details have been successfully updated.",
        });

        setTimeout(() => {
          router.push("/admin/recruitment/vacancies");
          router.refresh();
        }, 1200);
      } catch {
        setError("Network connection error. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/recruitment/vacancies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Vacancies</span>
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
      >
        <div className="border-b border-slate-100 pb-5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {mode === "create" ? "Create New Vacancy" : `Edit Vacancy: ${initialData?.title}`}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Configure the vacancy posting, responsibilities, applicant requirements, and publishing status.
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="min-w-0 flex-1">{error}</p>
          </div>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Title */}
          <div className="sm:col-span-2">
            <label htmlFor="title" className="block text-sm font-semibold text-slate-900">
              Job Title <span className="text-rose-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              disabled={isPending}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Cleaning Team Lead"
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-semibold text-slate-900">
              Department <span className="text-rose-600">*</span>
            </label>
            <input
              id="department"
              type="text"
              required
              disabled={isPending}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Cleaning Operations"
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-slate-900">
              Location <span className="text-rose-600">*</span>
            </label>
            <input
              id="location"
              type="text"
              required
              disabled={isPending}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Accra, Ghana"
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Employment Type */}
          <div>
            <label htmlFor="employmentType" className="block text-sm font-semibold text-slate-900">
              Employment Type
            </label>
            <select
              id="employmentType"
              disabled={isPending}
              value={employmentType}
              onChange={(e) =>
                setEmploymentType(e.target.value as VacancyInitialData["employmentType"])
              }
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="CASUAL">Casual</option>
            </select>
          </div>

          {/* Work Arrangement */}
          <div>
            <label htmlFor="workArrangement" className="block text-sm font-semibold text-slate-900">
              Work Arrangement
            </label>
            <select
              id="workArrangement"
              disabled={isPending}
              value={workArrangement}
              onChange={(e) =>
                setWorkArrangement(e.target.value as VacancyInitialData["workArrangement"])
              }
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="ON_SITE">On-site</option>
              <option value="HYBRID">Hybrid</option>
              <option value="REMOTE">Remote</option>
            </select>
          </div>

          {/* Openings */}
          <div>
            <label htmlFor="openings" className="block text-sm font-semibold text-slate-900">
              Openings Count
            </label>
            <input
              id="openings"
              type="number"
              min={1}
              max={100}
              disabled={isPending}
              value={openings}
              onChange={(e) => setOpenings(Number(e.target.value))}
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-semibold text-slate-900">
              Application Deadline (Optional)
            </label>
            <input
              id="deadline"
              type="date"
              disabled={isPending}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status */}
          <div className="sm:col-span-2">
            <label htmlFor="status" className="block text-sm font-semibold text-slate-900">
              Publishing Status
            </label>
            <select
              id="status"
              disabled={isPending}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as VacancyInitialData["status"])
              }
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="DRAFT">Draft (Not visible to public)</option>
              <option value="PUBLISHED">Published (Visible on Careers Portal)</option>
              <option value="CLOSED">Closed (Applications closed)</option>
              <option value="ARCHIVED">Archived (Internal historical record)</option>
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-semibold text-slate-900">
              Role Overview / Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              required
              disabled={isPending}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a comprehensive summary of the role, team context, and purpose..."
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Responsibilities */}
          <div className="sm:col-span-2">
            <label htmlFor="responsibilities" className="block text-sm font-semibold text-slate-900">
              Key Responsibilities <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="responsibilities"
              rows={4}
              required
              disabled={isPending}
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              placeholder="List daily duties and operational responsibilities..."
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Requirements */}
          <div className="sm:col-span-2">
            <label htmlFor="requirements" className="block text-sm font-semibold text-slate-900">
              Qualifications &amp; Requirements <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="requirements"
              rows={4}
              required
              disabled={isPending}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="List education, certifications, years of experience, or physical requirements..."
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Skills (Comma-separated) */}
          <div className="sm:col-span-2">
            <label htmlFor="skills" className="block text-sm font-semibold text-slate-900">
              Skills &amp; Competencies (Comma-separated)
            </label>
            <input
              id="skills"
              type="text"
              disabled={isPending}
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. Deep Cleaning, Steam Cleaning, Customer Service, Team Leadership"
              className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
          <Link
            href="/admin/recruitment/vacancies"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#031c43] px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-900 disabled:opacity-50 transition"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving Vacancy...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>{mode === "create" ? "Create Vacancy" : "Save Changes"}</span>
              </>
            )}
          </button>
        </div>
      </form>

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
