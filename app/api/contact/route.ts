import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { limitRequest, rateLimitHeaders } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().trim().email("Please provide a valid email address.").max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Subject must be at least 2 characters.").max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters.").max(3000),
});

export async function GET() {
  return apiSuccess("Contact service is active.");
}

export async function POST(request: Request) {
  try {
    const rateLimit = await limitRequest(request, "contact");

    if (rateLimit && !rateLimit.success) {
      return apiError(
        429,
        "RATE_LIMIT_EXCEEDED",
        "Too many contact requests. Please wait a moment and try again.",
        undefined,
        rateLimitHeaders(rateLimit)
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        "Please check your submission details.",
        { errors: parsed.error.flatten().fieldErrors }
      );
    }

    const { name, email, phone, subject, message } = parsed.data;

    const contactMessage = await db.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
        status: "NEW",
      },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        createdAt: true,
      },
    });

    return apiSuccess(
      "Thank you for contacting SAMB's Services. We have received your message and our team will get in touch shortly.",
      { contactMessage },
      201
    );
  } catch (error) {
    console.error("Contact submission error:", error);
    return apiError(
      500,
      "CONTACT_SUBMIT_FAILED",
      "Unable to send your message right now. Please reach out via phone or email."
    );
  }
}
