import { randomBytes } from "node:crypto";
import { z } from "zod";

export const applicationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name cannot exceed 100 characters."),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(120, "Email cannot exceed 120 characters."),
  phone: z
    .string()
    .trim()
    .min(7, "Please provide a valid phone number.")
    .max(30, "Phone number cannot exceed 30 characters."),
  location: z
    .string()
    .trim()
    .min(2, "Location is required.")
    .max(100, "Location cannot exceed 100 characters."),
  coverLetter: z
    .string()
    .trim()
    .max(3000, "Cover letter cannot exceed 3000 characters.")
    .optional()
    .or(z.literal("")),
  vacancyId: z
    .string()
    .uuid("Invalid vacancy identifier.")
    .optional()
    .or(z.literal("")),
});

/**
 * Generates an unpredictable, human-readable application reference.
 * Example: SAMB-APP-202611-9F2B
 */
export function generateApplicationReference(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const randomSuffix = randomBytes(2).toString("hex").toUpperCase();

  return `SAMB-APP-${year}${month}-${randomSuffix}`;
}

export function formatEmploymentType(type: string): string {
  switch (type) {
    case "FULL_TIME":
      return "Full-time";
    case "PART_TIME":
      return "Part-time";
    case "CONTRACT":
      return "Contract";
    case "TEMPORARY":
      return "Temporary";
    case "CASUAL":
      return "Casual";
    default:
      return type;
  }
}

export function formatWorkArrangement(arrangement: string): string {
  switch (arrangement) {
    case "ON_SITE":
      return "On-site";
    case "HYBRID":
      return "Hybrid";
    case "REMOTE":
      return "Remote";
    default:
      return arrangement;
  }
}

export function formatApplicationStatus(status: string): {
  label: string;
  badgeStyle: string;
  applicantExplanation: string;
} {
  switch (status) {
    case "SUBMITTED":
      return {
        label: "Application Received",
        badgeStyle: "bg-blue-100 text-blue-800 border-blue-200",
        applicantExplanation:
          "Your application has been received and is queued for initial screening by our recruitment team.",
      };
    case "UNDER_REVIEW":
      return {
        label: "Under Review",
        badgeStyle: "bg-amber-100 text-amber-800 border-amber-200",
        applicantExplanation:
          "Our hiring managers are currently evaluating your qualifications and experience.",
      };
    case "SHORTLISTED":
      return {
        label: "Shortlisted",
        badgeStyle: "bg-indigo-100 text-indigo-800 border-indigo-200",
        applicantExplanation:
          "Congratulations! Your profile has been shortlisted. Our team will contact you regarding next steps.",
      };
    case "INTERVIEW":
      return {
        label: "Interview Scheduled",
        badgeStyle: "bg-purple-100 text-purple-800 border-purple-200",
        applicantExplanation:
          "You have been selected for an interview. Please check your email or phone for meeting details.",
      };
    case "APPROVED":
      return {
        label: "Offer / Approved",
        badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-200",
        applicantExplanation:
          "Your application has been successful! We are excited to welcome you to the SAMB team.",
      };
    case "REJECTED":
      return {
        label: "Not Selected",
        badgeStyle: "bg-slate-100 text-slate-700 border-slate-200",
        applicantExplanation:
          "Thank you for your interest in SAMB. We have decided to proceed with other candidates whose experience more closely matches our current openings. Your details remain on file for future opportunities.",
      };
    case "WITHDRAWN":
      return {
        label: "Application Withdrawn",
        badgeStyle: "bg-rose-100 text-rose-800 border-rose-200",
        applicantExplanation:
          "This application was marked as withdrawn upon request.",
      };
    default:
      return {
        label: status,
        badgeStyle: "bg-slate-100 text-slate-800 border-slate-200",
        applicantExplanation: "Your application is being processed.",
      };
  }
}
  /**
 * Converts the skills array into JSON text for the database TEXT column.
 */
export function serializeVacancySkills(skills: string[]): string | null {
  const cleaned = skills
    .map((skill) => skill.trim())
    .filter(Boolean);

  return cleaned.length > 0 ? JSON.stringify(cleaned) : null;
}

/**
 * Converts database skills text back into an array for the UI.
 * Supports existing comma-separated values as a fallback.
 */
export function parseVacancySkills(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);

    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      return parsed.map((item) => item.trim()).filter(Boolean);
    }
  } catch {
    // Support older comma-separated values.
  }

  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

