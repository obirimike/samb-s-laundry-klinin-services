import { NextResponse } from "next/server";
import { z } from "zod";

import { suspendedAccountResponse } from "@/lib/account-access";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendQuoteResponseEmail } from "@/lib/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const responseSchema = z
  .object({
    decision: z.enum(["ACCEPT", "DECLINE", "ACCEPTED", "DECLINED"]),
    responseNote: z.string().trim().max(1000).optional(),
    note: z.string().trim().max(1000).optional(),
  });

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in to respond to a quote." },
        { status: 401 }
      );
    }

    if (session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { message: "Only customers can respond to quotes." },
        { status: 403 }
      );
    }

    const suspended = await suspendedAccountResponse(session.user.id);
    if (suspended) return suspended;

    const { id } = await params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Please provide valid JSON." },
        { status: 400 }
      );
    }

    const parsed = responseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Choose whether to accept or decline the quote." },
        { status: 400 }
      );
    }

    const { decision } = parsed.data;
    const responseNote = (parsed.data.responseNote ?? parsed.data.note ?? "").trim();
    const normalizedDecision: "ACCEPT" | "DECLINE" =
      decision.startsWith("ACCEPT") ? "ACCEPT" : "DECLINE";

    // Scope the lookup to this customer's own booking.
    const quote = await db.quote.findFirst({
      where: {
        id,
        booking: {
          is: {
            customerId: session.user.id,
          },
        },
      },
      include: {
        booking: {
          select: {
            bookingNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!quote || quote.status === "DRAFT") {
      // Don't disclose quotes that the customer isn't allowed to view.
      return NextResponse.json(
        { message: "Quote not found." },
        { status: 404 }
      );
    }

    if (quote.status !== "SENT") {
      return NextResponse.json(
        { message: "This quote is no longer awaiting a response." },
        { status: 409 }
      );
    }

    if (quote.expiresAt && quote.expiresAt <= new Date()) {
      await db.quote.updateMany({
        where: {
          id: quote.id,
          status: "SENT",
        },
        data: {
          status: "EXPIRED",
        },
      });

      return NextResponse.json(
        { message: "This quote has expired and can no longer be accepted or declined." },
        { status: 409 }
      );
    }

    const newStatus =
      normalizedDecision === "ACCEPT" ? "ACCEPTED" : "DECLINED";

    const now = new Date();

    const updated = await db.quote.updateMany({
      where: {
        id: quote.id,
        status: "SENT",
      },
      data: {
        status: newStatus,
        respondedAt: now,
        responseNote: responseNote || null,
      },
    });

    if (updated.count !== 1) {
      return NextResponse.json(
        { message: "This quote has already received a response. Refresh the page." },
        { status: 409 }
      );
    }

    const actionText =
      normalizedDecision === "ACCEPT" ? "accepted" : "declined";

    // Notification/email failures must not undo a customer's response.
    try {
      await db.notification.create({
        data: {
          userId: quote.createdBy.id,
          title: `Quote ${actionText}`,
          message: `${quote.booking.customer.name} ${actionText} quote ${quote.quoteNumber} for booking ${quote.booking.bookingNumber}.`,
          type: "QUOTE_RESPONSE",
        },
      });
    } catch (error) {
      console.error("Failed to create quote response notification:", error);
    }

    const emailResult = await sendQuoteResponseEmail({
      to: quote.createdBy.email,
      adminName: quote.createdBy.name || "Administrator",
      customerName: quote.booking.customer.name,
      quoteNumber: quote.quoteNumber,
      bookingNumber: quote.booking.bookingNumber,
      decision: newStatus,
      responseNote: responseNote || null,
    });

    return NextResponse.json({
      message:
        normalizedDecision === "ACCEPT"
          ? "You accepted the quote successfully."
          : "You declined the quote successfully.",
      status: newStatus,
      respondedAt: now.toISOString(),
      notificationEmailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Failed to record quote response:", error);

    return NextResponse.json(
      { message: "Unable to process your response right now." },
      { status: 500 }
    );
  }
}