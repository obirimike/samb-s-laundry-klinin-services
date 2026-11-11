import { Resend } from "resend";

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !fromAddress) {
    console.warn(
      "Email delivery is disabled because RESEND_API_KEY and EMAIL_FROM are not both configured."
    );
    return null;
  }

  try {
    return {
      resend: new Resend(apiKey),
      fromAddress,
    };
  } catch (error) {
    console.error(
      "Failed to initialize Resend client:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

function hasUsableEmailAddress(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0 && /.+@.+\..+/.test(value.trim());
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

const statusContent: Record<
  string,
  { title: string; message: string }
> = {
  CONFIRMED: {
    title: "Your booking is confirmed",
    message:
      "Your service request has been confirmed. We look forward to serving you.",
  },
  IN_PROGRESS: {
    title: "Your service has started",
    message:
      "Our team has started working on your booking.",
  },
  COMPLETED: {
    title: "Your service is complete",
    message:
      "Your booking has been marked as completed. Thank you for choosing SAMB's Laundry and Klinin Services.",
  },
  CANCELLED: {
    title: "Your booking has been cancelled",
    message:
      "Your booking has been cancelled. Please contact us if you need assistance.",
  },
};

export async function sendBookingStatusEmail({
  to,
  customerName,
  bookingNumber,
  status,
}: {
  to: string;
  customerName: string;
  bookingNumber: string;
  status: string;
}): Promise<{ success: boolean; id?: string; skipped?: boolean }> {
  if (!hasUsableEmailAddress(to)) {
    console.warn(`Email not sent for booking ${bookingNumber}: recipient email is missing or invalid.`);
    return { success: false };
  }

  const emailConfig = getEmailConfig();

  if (!emailConfig) {
    return { success: false, skipped: true };
  }

  const content = statusContent[status];

  if (!content) {
    return { success: false };
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const safeName = escapeHtml(customerName || "Customer");
  const safeBookingNumber = escapeHtml(bookingNumber);
  const safeMessage = escapeHtml(content.message);
  const safeTitle = escapeHtml(content.title);

  try {
    const { data, error } = await emailConfig.resend.emails.send({
      from: emailConfig.fromAddress,
      to: [to],
      subject: `${content.title} — ${bookingNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#172033;line-height:1.6">
          <div style="background:#123b73;padding:24px;border-radius:12px 12px 0 0">
            <h1 style="color:#ffffff;font-size:22px;margin:0">SAMB's Laundry and Klinin Services</h1>
          </div>
          <div style="padding:28px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px">
            <p>Hello ${safeName},</p>
            <h2 style="font-size:21px">${safeTitle}</h2>
            <p>${safeMessage}</p>
            <p><strong>Booking number:</strong> ${safeBookingNumber}</p>
            <p>
              <a href="${appUrl}/account/bookings"
                style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px">
                View my bookings
              </a>
            </p>
            <p style="font-size:13px;color:#64748b">
              If you have questions, please contact our team.
            </p>
          </div>
        </div>
      `,
      text: [
        `Hello ${customerName || "Customer"},`,
        "",
        content.title,
        content.message,
        `Booking number: ${bookingNumber}`,
        `View your bookings: ${appUrl}/account/bookings`,
        "",
        "SAMB's Laundry and Klinin Services",
      ].join("\n"),
    });

    if (error) {
      console.error("Resend email error:", error.message);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error(
      "Failed to send booking status email:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return { success: false };
  }
}

type QuoteEmailLine = {
  description?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
  total?: unknown;
};

function formatQuoteMoney(amount: number | string, currency: string) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function getQuoteEmailLines(value: unknown): QuoteEmailLine[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is QuoteEmailLine =>
      typeof item === "object" && item !== null
  );
}

export async function sendQuoteEmail({
  to,
  customerName,
  quoteNumber,
  bookingNumber,
  serviceName,
  amount,
  currency,
  breakdown,
  terms,
  expiresAt,
}: {
  to: string;
  customerName: string;
  quoteNumber: string;
  bookingNumber: string;
  serviceName: string;
  amount: string;
  currency: string;
  breakdown: unknown;
  terms: string | null;
  expiresAt: Date | null;
}): Promise<{ success: boolean; id?: string; skipped?: boolean }> {
  if (!hasUsableEmailAddress(to)) {
    console.warn(`Quote email not sent for quote ${quoteNumber}: recipient email is missing or invalid.`);
    return { success: false };
  }

  const emailConfig = getEmailConfig();

  if (!emailConfig) {
    return { success: false, skipped: true };
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");

  const lines = getQuoteEmailLines(breakdown);

  const htmlRows = lines
    .map((item) => {
      const description = escapeHtml(String(item.description ?? "Service"));
      const quantity = escapeHtml(String(item.quantity ?? 1));
      const total = Number(item.total ?? 0);

      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0">
            ${description}
          </td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0">
            ${quantity}
          </td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right">
            ${escapeHtml(formatQuoteMoney(total, currency))}
          </td>
        </tr>`;
    })
    .join("");

  const textRows = lines.map((item) => {
    const total = Number(item.total ?? 0);

    return `${String(item.description ?? "Service")} × ${
      item.quantity ?? 1
    }: ${formatQuoteMoney(total, currency)}`;
  });

  const safeName = escapeHtml(customerName || "Customer");
  const safeQuoteNumber = escapeHtml(quoteNumber);
  const safeBookingNumber = escapeHtml(bookingNumber);
  const safeServiceName = escapeHtml(serviceName);
  const safeAmount = escapeHtml(formatQuoteMoney(amount, currency));
  const safeTerms = escapeHtml(terms || "Please contact us if you have questions.")
    .replace(/\r?\n/g, "<br />");
  const safeExpiry = expiresAt
    ? escapeHtml(
        expiresAt.toLocaleDateString("en-GH", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Africa/Accra",
        })
      )
    : "Not specified";

  try {
    const { data, error } = await emailConfig.resend.emails.send({
      from: emailConfig.fromAddress,
      to: [to],
      subject: `Your service quote ${quoteNumber} — SAMB`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033;line-height:1.6">
          <div style="background:#123b73;padding:24px;border-radius:12px 12px 0 0">
            <h1 style="margin:0;color:#fff;font-size:22px">
              SAMB's Laundry and Klinin Services
            </h1>
          </div>
          <div style="padding:26px;border:1px solid #e2e8f0;border-top:0">
            <p>Hello ${safeName},</p>
            <h2>Your service quotation is ready</h2>
            <p>We have prepared a quote for your requested service.</p>
            <p><strong>Quote:</strong> ${safeQuoteNumber}</p>
            <p><strong>Booking:</strong> ${safeBookingNumber}</p>
            <p><strong>Service:</strong> ${safeServiceName}</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <thead>
                <tr style="background:#f8fafc;text-align:left">
                  <th style="padding:10px">Description</th>
                  <th style="padding:10px">Qty</th>
                  <th style="padding:10px;text-align:right">Amount</th>
                </tr>
              </thead>
              <tbody>${htmlRows}</tbody>
            </table>
            <p style="font-size:20px;font-weight:bold">
              Total: ${safeAmount}
            </p>
            <p><strong>Valid until:</strong> ${safeExpiry}</p>
            <p><strong>Terms:</strong><br />${safeTerms}</p>
            <p>Review the quote and respond through your account:</p>
            <p>
              <a href="${appUrl}/account/quotes"
                style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px">
                Review my quote
              </a>
            </p>
            <p style="font-size:13px;color:#64748b">
              This quotation does not itself confirm the booking or record payment.
            </p>
          </div>
        </div>
      `,
      text: [
        `Hello ${customerName || "Customer"},`,
        "",
        "Your service quotation is ready.",
        `Quote: ${quoteNumber}`,
        `Booking: ${bookingNumber}`,
        `Service: ${serviceName}`,
        "",
        ...textRows,
        "",
        `Total: ${formatQuoteMoney(amount, currency)}`,
        `Valid until: ${
          expiresAt ? expiresAt.toISOString() : "Not specified"
        }`,
        `Terms: ${terms || "Please contact us if you have questions."}`,
        "",
        `Review your quote: ${appUrl}/account/quotes`,
        "",
        "SAMB's Laundry and Klinin Services",
      ].join("\n"),
    });

    if (error) {
      console.error("Quote email error:", error.message);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error(
      "Failed to send quote email:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return { success: false };
  }
}

export async function sendQuoteResponseEmail({
  to,
  adminName,
  customerName,
  quoteNumber,
  bookingNumber,
  decision,
  responseNote,
}: {
  to: string;
  adminName: string;
  customerName: string;
  quoteNumber: string;
  bookingNumber: string;
  decision: "ACCEPTED" | "DECLINED";
  responseNote: string | null;
}): Promise<{ success: boolean; id?: string; skipped?: boolean }> {
  if (!hasUsableEmailAddress(to)) {
    console.warn(`Quote response email not sent for quote ${quoteNumber}: recipient email is missing or invalid.`);
    return { success: false };
  }

  const emailConfig = getEmailConfig();

  if (!emailConfig) {
    return { success: false, skipped: true };
  }

  const accepted = decision === "ACCEPTED";
  const title = accepted ? "Quote accepted" : "Quote declined";

  try {
    const { data, error } = await emailConfig.resend.emails.send({
      from: emailConfig.fromAddress,
      to: [to],
      subject: `${title}: ${quoteNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033;line-height:1.6">
          <div style="background:#123b73;padding:24px;border-radius:12px 12px 0 0">
            <h1 style="margin:0;color:#fff;font-size:22px">
              SAMB's Laundry and Klinin Services
            </h1>
          </div>
          <div style="padding:26px;border:1px solid #e2e8f0;border-top:0">
            <p>Hello ${escapeHtml(adminName || "Administrator")},</p>
            <h2>${title}</h2>
            <p>
              ${escapeHtml(customerName)} has ${
                accepted ? "accepted" : "declined"
              } quote ${escapeHtml(quoteNumber)}.
            </p>
            <p><strong>Booking:</strong> ${escapeHtml(bookingNumber)}</p>
            ${
              responseNote
                ? `<p><strong>Customer note:</strong><br />${escapeHtml(
                    responseNote
                  ).replace(/\r?\n/g, "<br />")}</p>`
                : ""
            }
          </div>
        </div>
      `,
      text: [
        `Hello ${adminName || "Administrator"},`,
        "",
        `${customerName} has ${accepted ? "accepted" : "declined"} quote ${quoteNumber}.`,
        `Booking: ${bookingNumber}`,
        responseNote ? `Customer note: ${responseNote}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (error) {
      console.error("Quote response email error:", error.message);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error(
      "Failed to send quote response email:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return { success: false };
  }
}
  export async function sendPasswordResetEmail({
  to,
  customerName,
  resetUrl,
}: {
  to: string;
  customerName: string;
  resetUrl: string;
}): Promise<{ success: boolean; id?: string; skipped?: boolean }> {
  if (!hasUsableEmailAddress(to)) {
    console.warn("Password reset email not sent: invalid recipient.");
    return { success: false };
  }

  const emailConfig = getEmailConfig();

  if (!emailConfig) {
    return { success: false, skipped: true };
  }

  const safeName = escapeHtml(customerName || "Customer");
  const safeUrl = escapeHtml(resetUrl);

  try {
    const { data, error } = await emailConfig.resend.emails.send({
      from: emailConfig.fromAddress,
      to: [to],
      subject: "Reset your SAMB account password",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#172033;line-height:1.6">
          <div style="background:#123b73;padding:24px;border-radius:12px 12px 0 0">
            <h1 style="color:#ffffff;font-size:22px;margin:0">
              SAMB's Laundry and Klinin Services
            </h1>
          </div>

          <div style="padding:28px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px">
            <p>Hello ${safeName},</p>

            <h2>Reset your password</h2>

            <p>
              We received a request to reset the password associated with
              your SAMB account.
            </p>

            <p>
              Use the button below to choose a new password. This link
              expires in 30 minutes and can only be used once.
            </p>

            <p>
              <a href="${safeUrl}"
                style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold">
                Reset my password
              </a>
            </p>

            <p>
              If the button does not work, copy and paste this link into
              your browser:
            </p>

            <p style="word-break:break-all;font-size:13px">
              ${safeUrl}
            </p>

            <p style="font-size:13px;color:#64748b">
              If you did not request a password reset, you can safely
              ignore this email. Your password will not change.
            </p>
          </div>
        </div>
      `,
      text: [
        `Hello ${customerName || "Customer"},`,
        "",
        "We received a request to reset your SAMB account password.",
        "",
        "Use this link to choose a new password:",
        resetUrl,
        "",
        "This link expires in 30 minutes and can only be used once.",
        "",
        "If you did not request this, you can ignore this email.",
        "",
        "SAMB's Laundry and Klinin Services",
      ].join("\n"),
    });

    if (error) {
      console.error("Password reset email error:", error.message);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error(
      "Failed to send password reset email:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return { success: false };
  }
}

export async function sendApplicationConfirmationEmail({
  to,
  fullName,
  applicationReference,
  positionTitle,
}: {
  to: string;
  fullName: string;
  applicationReference: string;
  positionTitle: string;
}): Promise<{ success: boolean; id?: string; skipped?: boolean }> {
  if (!hasUsableEmailAddress(to)) {
    return { success: false };
  }

  const emailConfig = getEmailConfig();
  if (!emailConfig) {
    return { success: false, skipped: true };
  }

  const safeName = escapeHtml(fullName || "Applicant");
  const safeRef = escapeHtml(applicationReference);
  const safePosition = escapeHtml(positionTitle);

  try {
    const { data, error } = await emailConfig.resend.emails.send({
      from: emailConfig.fromAddress,
      to: [to],
      subject: `Application Received: ${positionTitle} (${applicationReference})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#172033;line-height:1.6">
          <div style="background:#031c43;padding:24px;border-radius:12px 12px 0 0">
            <h1 style="color:#ffffff;font-size:22px;margin:0">
              SAMB's Laundry &amp; Klinin Services
            </h1>
          </div>
          <div style="padding:28px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px">
            <p>Dear ${safeName},</p>
            <p>Thank you for applying for <strong>${safePosition}</strong> at SAMB's Services.</p>
            <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:20px 0">
              <p style="margin:0;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:bold">Application Reference</p>
              <p style="margin:4px 0 0 0;font-size:20px;font-family:monospace;font-weight:bold;color:#031c43">${safeRef}</p>
            </div>
            <p>Our recruitment team is reviewing your application. You can track your application status at any time using your reference code and email address on our Careers portal.</p>
            <p style="font-size:13px;color:#64748b;margin-top:30px">
              Best regards,<br />
              <strong>SAMB Recruitment Team</strong>
            </p>
          </div>
        </div>
      `,
      text: [
        `Dear ${fullName},`,
        "",
        `Thank you for applying for "${positionTitle}" at SAMB's Services.`,
        "",
        `Your application reference number is: ${applicationReference}`,
        "",
        "Our recruitment team will review your submission and contact you regarding the next steps.",
        "",
        "You can track your application status on our website with your reference number.",
        "",
        "SAMB Recruitment Team",
      ].join("\n"),
    });

    if (error) {
      console.error("Application confirmation email error:", error.message);
      return { success: false };
    }
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send application confirmation email:", error);
    return { success: false };
  }
}

export async function sendAdminNewApplicationAlert({
  applicationReference,
  fullName,
  email,
  phone,
  positionTitle,
  applicationId,
}: {
  applicationReference: string;
  fullName: string;
  email: string;
  phone: string;
  positionTitle: string;
  applicationId: string;
}): Promise<{ success: boolean; id?: string; skipped?: boolean }> {
  const emailConfig = getEmailConfig();
  if (!emailConfig) {
    return { success: false, skipped: true };
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || emailConfig.fromAddress;
  if (!hasUsableEmailAddress(adminEmail)) {
    return { success: false, skipped: true };
  }

  const safeRef = escapeHtml(applicationReference);
  const safeName = escapeHtml(fullName);
  const safePosition = escapeHtml(positionTitle);

  try {
    const { data, error } = await emailConfig.resend.emails.send({
      from: emailConfig.fromAddress,
      to: [adminEmail],
      subject: `[New Application] ${positionTitle} - ${fullName} (${applicationReference})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#172033;line-height:1.6">
          <div style="background:#031c43;padding:24px;border-radius:12px 12px 0 0">
            <h1 style="color:#ffffff;font-size:20px;margin:0">New Candidate Application</h1>
          </div>
          <div style="padding:28px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px">
            <p>A new application has been submitted:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:6px 0;color:#64748b">Position:</td><td style="padding:6px 0;font-weight:bold">${safePosition}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Applicant:</td><td style="padding:6px 0;font-weight:bold">${safeName}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Email:</td><td style="padding:6px 0">${escapeHtml(email)}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Phone:</td><td style="padding:6px 0">${escapeHtml(phone)}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Reference:</td><td style="padding:6px 0;font-family:monospace;font-weight:bold">${safeRef}</td></tr>
            </table>
            <p><a href="/admin/recruitment/applications/${applicationId}" style="display:inline-block;background:#031c43;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold">View Application in Admin Dashboard</a></p>
          </div>
        </div>
      `,
      text: [
        `New Candidate Application: ${positionTitle}`,
        "",
        `Applicant: ${fullName}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Reference: ${applicationReference}`,
        "",
        `Review at: /admin/recruitment/applications/${applicationId}`,
      ].join("\n"),
    });

    if (error) {
      console.error("Admin recruitment alert email error:", error.message);
      return { success: false };
    }
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send admin recruitment notification:", error);
    return { success: false };
  }
}
