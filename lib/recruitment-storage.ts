import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase";

export const RECRUITMENT_BUCKET = "SamB bucket";
export const MAX_CV_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_CV_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const ALLOWED_CV_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

/**
 * Validates the file buffer header against known magic bytes to prevent renamed executables/scripts.
 */
export function validateDocumentMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
  if (mimeType === "application/pdf") {
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }

  // DOCX / modern Office XML (ZIP container): PK\x03\x04 (0x50 0x4B 0x03 0x04)
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    );
  }

  // Legacy Word DOC: D0 CF 11 E0 (Compound File Binary Format)
  if (mimeType === "application/msword") {
    return (
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0
    );
  }

  return false;
}

/**
 * Sanitizes original filename to prevent path traversal, control character injection, or directory escaping.
 */
export function sanitizeFileName(rawName: string): string {
  const base = path.basename(rawName).trim();
  const sanitized = base
    .replace(/[^a-zA-Z0-9.\-_ ]/g, "")
    .replace(/\.{2,}/g, ".")
    .trim();

  return sanitized.length > 0 ? sanitized : "document.pdf";
}

/**
 * Ensures the private Supabase storage bucket exists.
 */
let bucketChecked = false;
export async function ensureRecruitmentBucketExists(): Promise<void> {
  if (bucketChecked) return;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === RECRUITMENT_BUCKET);

    if (!exists) {
      await supabaseAdmin.storage.createBucket(RECRUITMENT_BUCKET, {
        public: false,
        fileSizeLimit: MAX_CV_FILE_SIZE,
        allowedMimeTypes: Array.from(ALLOWED_CV_MIME_TYPES),
      });
    }

    bucketChecked = true;
  } catch (err) {
    console.warn("Could not verify Supabase storage bucket (will proceed if already exists):", err);
  }
}

/**
 * Uploads a validated CV file to private Supabase Storage.
 * Returns metadata and unpredictable storage path.
 */
export async function uploadCvDocument(
  buffer: Buffer,
  originalName: string,
  declaredMimeType: string
): Promise<{
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}> {
  if (buffer.length > MAX_CV_FILE_SIZE) {
    throw new Error("File size exceeds the 5 MB limit.");
  }

  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_CV_EXTENSIONS.has(ext)) {
    throw new Error("Unsupported file type. Please upload a PDF, DOC, or DOCX document.");
  }

  let normalizedMime = declaredMimeType;
  if (!ALLOWED_CV_MIME_TYPES.has(normalizedMime)) {
    if (ext === ".pdf") normalizedMime = "application/pdf";
    else if (ext === ".docx") {
      normalizedMime =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (ext === ".doc") {
      normalizedMime = "application/msword";
    } else {
      throw new Error("Invalid document format.");
    }
  }

  const isValidMagic = validateDocumentMagicBytes(buffer, normalizedMime);
  if (!isValidMagic) {
    throw new Error(
      "The file contents do not match a valid PDF or Word document."
    );
  }

  await ensureRecruitmentBucketExists();

  const now = new Date();
  const yearMonth = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const uniqueKey = randomUUID();
  const storagePath = `applications/${yearMonth}/${uniqueKey}${ext}`;
  const cleanFileName = sanitizeFileName(originalName);
  const supabaseAdmin = getSupabaseAdmin();
 

  const { error: uploadError } = await supabaseAdmin.storage
    .from(RECRUITMENT_BUCKET)
    .upload(storagePath, buffer, {
      contentType: normalizedMime,
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase Storage upload error:", uploadError);
    throw new Error("Failed to store your CV securely. Please try again.");
  }

  return {
    storagePath,
    fileName: cleanFileName,
    mimeType: normalizedMime,
    fileSize: buffer.length,
  };
}

/**
 * Deletes a CV document from storage (used for transactional rollback or cleanup).
 */
export async function deleteCvDocument(storagePath: string): Promise<void> {
  if (!storagePath) return;
  const supabaseAdmin = getSupabaseAdmin();
  try {
    await supabaseAdmin.storage
      .from(RECRUITMENT_BUCKET)
      .remove([storagePath]);
  } catch (err) {
    console.error("Failed to delete orphaned CV document:", storagePath, err);
  }
}

/**
 * Creates a short-lived signed URL for an authorized administrator to view/download a CV.
 * Default expiration: 15 minutes (900 seconds).
 */
export async function createCvSignedUrl(
  storagePath: string,
  expiresInSeconds = 900
): Promise<string> {
  if (!storagePath) {
    throw new Error("Invalid storage path.");
  }
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.storage
    .from(RECRUITMENT_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error("Failed to generate signed URL:", error);
    throw new Error("Unable to retrieve document.");
  }

  return data.signedUrl;
}
