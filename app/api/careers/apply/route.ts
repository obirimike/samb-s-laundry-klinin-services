import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { limitRequest, rateLimitHeaders } from "@/lib/rate-limit";
import {
  applicationSchema,
  generateApplicationReference,
} from "@/lib/recruitment";
import {
  uploadCvDocument,
  deleteCvDocument,
  MAX_CV_FILE_SIZE,
} from "@/lib/recruitment-storage";
import {
  sendApplicationConfirmationEmail,
  sendAdminNewApplicationAlert,
} from "@/lib/emails";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let uploadedStoragePath: string | null = null;

  try {
    const rateLimit = await limitRequest(request, "recruitment");
    if (rateLimit && !rateLimit.success) {
      return apiError(
        429,
        "TOO_MANY_REQUESTS",
        "Too many application attempts. Please wait a few minutes before trying again.",
        undefined,
        rateLimitHeaders(rateLimit)
      );
    }

    const formData = await request.formData();

    const rawData = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      location: formData.get("location"),
      coverLetter: formData.get("coverLetter") || "",
      vacancyId: formData.get("vacancyId") || "",
    };

    const parsed = applicationSchema.safeParse(rawData);
    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        "Please check the highlighted application fields.",
        { errors: parsed.error.flatten().fieldErrors }
      );
    }

    const input = parsed.data;

    // Validate CV file attachment
    const cvFile = formData.get("cvFile");
    if (!cvFile || !(cvFile instanceof File) || cvFile.size === 0) {
      return apiError(
        422,
        "MISSING_CV",
        "Please upload your CV or resume (PDF, DOC, or DOCX, up to 5 MB).",
        { errors: { cv: ["A CV or resume document is required."] } }
      );
    }

    if (cvFile.size > MAX_CV_FILE_SIZE) {
      return apiError(
        422,
        "FILE_TOO_LARGE",
        "Your CV file exceeds the 5 MB maximum size limit.",
        { errors: { cv: ["File must be smaller than 5 MB."] } }
      );
    }

    // Verify vacancy if vacancy-specific
    let vacancyTitle = "General Application";
    let vacancyRecord = null;

    if (input.vacancyId) {
      vacancyRecord = await db.vacancy.findUnique({
        where: { id: input.vacancyId },
        select: {
          id: true,
          title: true,
          status: true,
          deadline: true,
        },
      });

      if (!vacancyRecord || vacancyRecord.status !== "PUBLISHED") {
        return apiError(
          400,
          "VACANCY_NOT_ACCEPTING",
          "This vacancy is no longer accepting applications. You may submit a general application instead."
        );
      }

      if (vacancyRecord.deadline && new Date(vacancyRecord.deadline) < new Date()) {
        return apiError(
          400,
          "VACANCY_EXPIRED",
          "The deadline for this vacancy has passed. You may submit a general application instead."
        );
      }

      vacancyTitle = vacancyRecord.title;
    }

    // Read file bytes and upload to private Supabase bucket
    const fileBytes = Buffer.from(await cvFile.arrayBuffer());
    const uploaded = await uploadCvDocument(
      fileBytes,
      cvFile.name,
      cvFile.type
    );
    uploadedStoragePath = uploaded.storagePath;

    // Generate reference and persist application with status history
    const reference = generateApplicationReference();

    const application = await db.$transaction(async (tx: any ) => {
      const created = await tx.jobApplication.create({
        data: {
          applicationReference: reference,
          vacancyId: vacancyRecord?.id || null,
          fullName: input.fullName,
          email: input.email.toLowerCase(),
          phone: input.phone,
          location: input.location,
          coverLetter: input.coverLetter || null,
          cvStoragePath: uploaded.storagePath,
          cvFileName: uploaded.fileName,
          cvMimeType: uploaded.mimeType,
          cvFileSize: uploaded.fileSize,
          status: "SUBMITTED",
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: created.id,
          previousStatus: null,
          newStatus: "SUBMITTED",
          note: "Application submitted online by candidate.",
        },
      });

      return created;
    });

    // Asynchronously send transactional emails (non-blocking)
    sendApplicationConfirmationEmail({
      to: input.email,
      fullName: input.fullName,
      applicationReference: reference,
      positionTitle: vacancyTitle,
    }).catch((err) => console.error("Failed to send applicant confirmation email:", err));

    sendAdminNewApplicationAlert({
      applicationReference: reference,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      positionTitle: vacancyTitle,
      applicationId: application.id,
    }).catch((err) => console.error("Failed to send admin recruitment notification:", err));

    return apiSuccess(
      "Your application has been received successfully.",
      {
        application: {
          reference: application.applicationReference,
          fullName: application.fullName,
          position: vacancyTitle,
          submittedAt: application.submittedAt,
        },
      },
      201
    );
  } catch (error) {
    // If file was uploaded to storage but DB write failed, clean up orphaned file
    if (uploadedStoragePath) {
      await deleteCvDocument(uploadedStoragePath);
    }

    console.error("Recruitment application error:", error);

    const errorMessage =
      error instanceof Error && error.message.includes("limit")
        ? error.message
        : "Unable to process your application right now. Please try again.";

    return apiError(500, "APPLICATION_SUBMIT_FAILED", errorMessage);
  }
}
