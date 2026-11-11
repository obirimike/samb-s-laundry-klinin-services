import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { createCvSignedUrl } from "@/lib/recruitment-storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;

    const application = await db.jobApplication.findUnique({
      where: { id },
      select: {
        id: true,
        applicationReference: true,
        fullName: true,
        cvStoragePath: true,
        cvFileName: true,
        cvMimeType: true,
        cvFileSize: true,
      },
    });

    if (!application) {
      return apiError(404, "APPLICATION_NOT_FOUND", "Application not found.");
    }

    if (!application.cvStoragePath) {
      return apiError(404, "CV_NOT_FOUND", "No CV document attached to this application.");
    }

    // Generate short-lived signed URL (15 minutes expiry)
    const signedUrl = await createCvSignedUrl(application.cvStoragePath, 900);

    // Audit log the document access
    await writeAudit(db, {
      actorId: guard.session.user.id,
      action: "CV_ACCESSED",
      entityType: "JOB_APPLICATION",
      entityId: application.id,
      changes: {
        reference: application.applicationReference,
        fileName: application.cvFileName,
      },
    });

    return apiSuccess("CV signed URL generated.", {
      signedUrl,
      fileName: application.cvFileName,
      mimeType: application.cvMimeType,
      fileSize: application.cvFileSize,
      expiresInSeconds: 900,
    });
  } catch (error) {
    console.error("Generate CV signed URL error:", error);
    return apiError(
      500,
      "CV_RETRIEVAL_FAILED",
      "Unable to generate secure download link for this CV."
    );
  }
}
