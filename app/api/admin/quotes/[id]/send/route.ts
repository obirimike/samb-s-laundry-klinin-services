import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendQuoteEmail } from "@/lib/emails";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must sign in to continue." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only administrators can send quotes." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const result = await db.$transaction(async (tx: any ) => {
      const quote = await tx.quote.findUnique({
        where: { id },
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              customerId: true,
              customer: {
                select: {
                  name: true,
                  email: true,
                },
              },
              service: {
                select: { name: true },
              },

            },
          },
        },
      });

      if (!quote) {
        return { kind: "NOT_FOUND" as const };
      }

      if (quote.status !== "DRAFT" && quote.status !== "SENT") {
        return { kind: "INVALID_STATUS" as const };
      }

      const now = new Date();

      if (quote.expiresAt && quote.expiresAt <= now) {
        await tx.quote.update({
          where: { id: quote.id },
          data: { status: "EXPIRED" },
        });

        return { kind: "EXPIRED" as const };
      }

      const firstSend = quote.status === "DRAFT";

      if (firstSend) {
        const updated = await tx.quote.updateMany({
          where: {
            id: quote.id,
            status: "DRAFT",
          },
          data: {
            status: "SENT",
            sentAt: now,
          },
        });

        if (updated.count !== 1) {
          return { kind: "CONFLICT" as const };
        }

        await tx.notification.create({
          data: {
            userId: quote.booking.customerId,
            title: "A service quote is ready",
            message: `Quote ${quote.quoteNumber} is ready for booking ${quote.booking.bookingNumber}.`,
            type: "QUOTE_SENT",
          },
        });

        await writeAudit(tx, {
          actorId: session.user.id,
          action: "QUOTE_SENT",
          entityType: "QUOTE",
          entityId: quote.id,
          changes: {
            before: { status: "DRAFT" },
            after: { status: "SENT" },
          },
        });
      }

      return {
        kind: "READY" as const,
        firstSend,
        quote: {
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          amount: quote.amount.toString(),
          currency: quote.currency,
          breakdown: quote.breakdown,
          terms: quote.terms,
          expiresAt: quote.expiresAt,
          customerName: quote.booking.customer.name,
          customerEmail: quote.booking.customer.email,
          bookingNumber: quote.booking.bookingNumber,
          serviceName: quote.booking.service.name,
        },
      };
    });

    if (result.kind === "NOT_FOUND") {
      return NextResponse.json(
        { message: "Quote not found." },
        { status: 404 }
      );
    }

    if (result.kind === "INVALID_STATUS") {
      return NextResponse.json(
        { message: "Only draft or sent quotes can be emailed." },
        { status: 409 }
      );
    }

    if (result.kind === "EXPIRED") {
      return NextResponse.json(
        { message: "The quote has expired and cannot be sent." },
        { status: 400 }
      );
    }

    if (result.kind === "CONFLICT") {
      return NextResponse.json(
        { message: "The quote changed. Refresh the page and try again." },
        { status: 409 }
      );
    }

    const emailResult = await sendQuoteEmail({
      to: result.quote.customerEmail,
      customerName: result.quote.customerName,
      quoteNumber: result.quote.quoteNumber,
      bookingNumber: result.quote.bookingNumber,
      serviceName: result.quote.serviceName,
      amount: result.quote.amount,
      currency: result.quote.currency,
      breakdown: result.quote.breakdown,
      terms: result.quote.terms,
      expiresAt: result.quote.expiresAt,
    });

    return NextResponse.json({
      message: emailResult.success
        ? result.firstSend
          ? "Quote sent successfully."
          : "Quote email sent again successfully."
        : "The quote is available in the customer's account, but the email could not be sent. Check your Resend configuration and retry.",
      emailSent: emailResult.success,
      status: "SENT",
    });
  } catch (error) {
    console.error("Failed to send quote:", error);

    return NextResponse.json(
      { message: "Unable to send the quote right now." },
      { status: 500 }
    );
  }
}