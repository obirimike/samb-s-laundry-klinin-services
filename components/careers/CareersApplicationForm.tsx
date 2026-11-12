"use client";

import { useState, useRef, useTransition, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  Copy,
  Check,
  Briefcase,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import FeedbackModal from "@/components/ui/FeedbackModal";

export type ApplicationVacancyInfo = {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType?: string;
};

type CareersApplicationFormProps = {
  vacancy?: ApplicationVacancyInfo | null;
  isGeneral?: boolean;
};

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function CareersApplicationForm({
  vacancy,
  isGeneral = false,
}: CareersApplicationFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
    ref?: string;
  }>({
    isOpen: false,
    variant: "success",
    title: "",
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): string | null => {
    const ext = "." + selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "Only PDF, DOC, and DOCX files are allowed.";
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `File size is ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed is 5 MB.`;
    }
    if (selectedFile.size === 0) {
      return "The uploaded file is empty.";
    }
    return null;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const error = validateFile(selected);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, cvFile: error }));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.cvFile;
        return next;
      });
      setFile(selected);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.cvFile;
      return next;
    });
  };

  const handleCopyReference = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = "Please enter your full name (at least 2 characters).";
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (!phone.trim() || phone.trim().length < 7) {
      errors.phone = "Please enter a valid phone number (at least 7 digits).";
    }
    if (!location.trim() || location.trim().length < 2) {
      errors.location = "Please enter your current city or location.";
    }
    if (!coverLetter.trim() || coverLetter.trim().length < 20) {
      errors.coverLetter = "Cover letter must be at least 20 characters.";
    } else if (coverLetter.trim().length > 3000) {
      errors.coverLetter = "Cover letter cannot exceed 3,000 characters.";
    }
    if (!file) {
      errors.cvFile = "Please attach your CV/resume (PDF or DOC/DOCX, max 5 MB).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("fullName", fullName.trim());
        formData.append("email", email.trim().toLowerCase());
        formData.append("phone", phone.trim());
        formData.append("location", location.trim());
        formData.append("coverLetter", coverLetter.trim());
        if (vacancy?.id) {
          formData.append("vacancyId", vacancy.id);
        }
        if (file) {
          formData.append("cvFile", file);
        }

        const response = await fetch("/api/careers/apply", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage =
            typeof data?.message === "string"
              ? data.message
              : typeof data?.error?.message === "string"
                ? data.error.message
                : "Failed to submit application. Please check your inputs and try again.";
          setFormError(errorMessage);
          setFeedback({
            isOpen: true,
            variant: "error",
            title: "Submission Error",
            message: errorMessage,
          });
          return;
        }

        const reference =
  data?.data?.application?.reference || data?.application?.reference;
        if (reference) {
          setSubmittedReference(reference);
          setFeedback({
            isOpen: true,
            variant: "success",
            title: "Application Received!",
            message:
              "Your application has been received successfully. Please keep your application reference number safe so you can track its progress.",
            ref: reference,
          });
        }
      } catch {
        setFormError("A network error occurred. Please check your connection and try again.");
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Network Error",
          message: "Unable to connect to the recruitment service. Please try again later.",
        });
      }
    });
  };

  // Success Confirmation Card
  if (submittedReference) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={36} />
        </div>

        <div className="mt-6 text-center">
          <span className="inline-block rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
            Application Submitted
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Thank you for applying!
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
            {vacancy
              ? `Your application for "${vacancy.title}" has been successfully logged with our recruitment team.`
              : "Your general application has been successfully logged with our recruitment team."}
          </p>
        </div>

        {/* Reference Box */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Your Application Reference Number
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="font-mono text-2xl font-extrabold tracking-wider text-[#031c43] sm:text-3xl">
              {submittedReference}
            </span>
            <button
              type="button"
              onClick={() => handleCopyReference(submittedReference)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              title="Copy reference number"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Please keep this reference safe. You will need this along with your email address to track your application.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/careers/track?ref=${encodeURIComponent(submittedReference)}&email=${encodeURIComponent(email)}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#031c43] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-900 transition"
          >
            <span>Track Application Status</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/careers"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Explore Other Openings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10"
      >
        {/* Banner for Vacancy vs General */}
        <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-900">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                {isGeneral || !vacancy ? " Form" : "Vacancy Application"}
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-slate-900">
                {vacancy ? vacancy.title : " General Application"}
              </h3>
              {vacancy && (
                <p className="text-xs text-slate-600 mt-1">
                  Department: <span className="font-semibold">{vacancy.department}</span> · Location:{" "}
                  <span className="font-semibold">{vacancy.location}</span>
                </p>
              )}
              {!vacancy && (
                <p className="text-xs text-slate-600 mt-1">
                  Submit your resume for consideration as new openings and service expansion roles arise at SAMB.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Global Error */}
        {formError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">{formError}</div>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label htmlFor="fullName" className="block text-sm font-semibold text-slate-900">
              Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              required
              disabled={isPending}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ama Mensah"
              className={`mt-2 block w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.fullName
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                  : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.fullName && (
              <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
              Email Address <span className="text-rose-600">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={isPending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ama.mensah@example.com"
              className={`mt-2 block w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.email
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                  : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-900">
              Phone Number <span className="text-rose-600">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              required
              disabled={isPending}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233 54 000 0000"
              className={`mt-2 block w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.phone
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                  : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.phone && (
              <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.phone}</p>
            )}
          </div>

          {/* Location */}
          <div className="sm:col-span-2">
            <label htmlFor="location" className="block text-sm font-semibold text-slate-900">
              Current Location / City <span className="text-rose-600">*</span>
            </label>
            <input
              id="location"
              type="text"
              required
              disabled={isPending}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Accra, Tema, Kumasi"
              className={`mt-2 block w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.location
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                  : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.location && (
              <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.location}</p>
            )}
          </div>

          {/* Cover Letter */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <label htmlFor="coverLetter" className="block text-sm font-semibold text-slate-900">
                Cover Letter / Why You&apos;re a Great Fit <span className="text-rose-600">*</span>
              </label>
              <span className="text-xs text-slate-400">{coverLetter.length} / 3000</span>
            </div>
            <textarea
              id="coverLetter"
              rows={5}
              required
              disabled={isPending}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Introduce yourself, your relevant background in laundry/cleaning services or operations, and what motivates you to join SAMB..."
              className={`mt-2 block w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.coverLetter
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                  : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
              }`}
            />
            {fieldErrors.coverLetter && (
              <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.coverLetter}</p>
            )}
          </div>

          {/* CV / Resume Upload */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-900">
              Attach CV / Resume <span className="text-rose-600">*</span>
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              Accepted formats: PDF, DOC, DOCX. Maximum file size: 5 MB. Documents are stored securely and accessible only to recruitment administrators.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              id="cvFile"
              name="cvFile"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={isPending}
              onChange={handleFileChange}
              className="sr-only"
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                className={`mt-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
                  fieldErrors.cvFile
                    ? "border-rose-300 bg-rose-50/50 hover:bg-rose-50"
                    : "border-slate-300 bg-slate-50/70 hover:bg-slate-50 hover:border-blue-400"
                }`}
              >
                <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 text-blue-600">
                  <UploadCloud size={28} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Click to select or drag and drop your CV here
                </p>
                <p className="mt-1 text-xs text-slate-500">PDF, DOC, DOCX up to 5 MB</p>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-800">
                    <FileText size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB · Ready for upload
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={isPending}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                  title="Remove file"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {fieldErrors.cvFile && (
              <p className="mt-1.5 text-xs text-rose-600">{fieldErrors.cvFile}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-500">
            By submitting, you agree to our privacy handling of your recruitment details.
          </p>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#031c43] px-8 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Submit Application</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Optional feedback modal on error/prompt */}
      <FeedbackModal
        isOpen={feedback.isOpen && feedback.variant === "error"}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
      />
    </>
  );
}
