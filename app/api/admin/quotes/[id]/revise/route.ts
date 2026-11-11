import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const lineItemSchema = z
  .object({
    description: z.string().trim().min(1).max(200),
    quantity: z.number().int().positive().max(100000),
    unitPrice: z.number().finite().nonnegative().max(100000000),
  })
  .strict();

const reviseSchema = z
  .object({
    items: z.array(lineItemSchema).min(1).max(50),
    terms: z.string().trim().max(5000).optional(),
    expiresAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

function getQuoteNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");

  return `SAMB-Q-${date}-${randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase()}`;
}

function calculateTotal(items: z.infer<typeof lineItemSchema>[]) {
  const breakdown = items.map((item) => {
    const unitPricePesewas = Math.round(item.unitPrice * 100);
    const totalPesewas = item.quantity * unitPricePesewas;

    if (
      !Number.isSafeInteger(unitPricePesewas) ||
      !Number.isSafeInteger(totalPesewas)
    ) {
      throw new Error("A quote item exceeds the supported amount.");
    }

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: unitPricePesewas / 100,
      total: totalPesewas / 100,
      totalPesewas,
    };
  });

  const totalPesewas = breakdown.reduce(
    (sum, item) => sum + item.totalPesewas,
    0
  );

  if (!Number.isSafeInteger(totalPesewas) || totalPesewas <= 0) {
    throw new Error("The quote total must be greater than zero.");
  }

  return {
    amount: (totalPesewas / 100).toFixed(2),
    breakdown: breakdown.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
  };
}

export async function POST(request: Request, context: RouteContext) {
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
        { message: "Only administrators can revise quotes." },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Please provide valid JSON." },
        { status: 400 }
      );
    }

    const parsed = reviseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please check the revised quote details.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { items, terms, expiresAt } = parsed.data;

    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
      return NextResponse.json(
        { message: "The expiry date must be in the future." },
        { status: 400 }
      );
    }

    let calculated: ReturnType<typeof calculateTotal>;

    try {
      calculated = calculateTotal(items);
    } catch (error) {
      return NextResponse.json(
        {
          message:
            error instanceof Error
              ? error.message
              : "Unable to calculate the revised quote.",
        },
        { status: 400 }
      );
    }

    const { id } = await context.params;

    const result = await db.$transaction(async (tx: any ) => {
      const source = await tx.quote.findUnique({
        where: { id },
        include: {
          booking: {
            select: {
              id: true,
              status: true,
              bookingNumber: true,
              customerId: true,
            },
          },
        },
      });

      if (!source) {
        return { kind: "NOT_FOUND" as const };
      }

      if (!["DRAFT", "SENT", "EXPIRED"].includes(source.status)) {
        return { kind: "INVALID_STATUS" as const };
      }

      if (source.booking.status === "CANCELLED") {
        return { kind: "CANCELLED_BOOKING" as const };
      }

      const existingRevision = await tx.quote.findFirst({
        where: { previousQuoteId: source.id },
        select: { id: true },
      });

      if (existingRevision) {
        return { kind: "ALREADY_REVISED" as const };
      }

      if (source.status === "DRAFT" || source.status === "SENT") {
        const updated = await tx.quote.updateMany({
          where: {
            id: source.id,
            status: source.status,
          },
          data: {
            status: "WITHDRAWN",
          },
        });

        if (updated.count !== 1) {
          return { kind: "CONFLICT" as const };
        }
      }

      const revisedQuote = await tx.quote.create({
        data: {
          quoteNumber: getQuoteNumber(),
          bookingId: source.bookingId,
          createdById: session.user.id,
          previousQuoteId: source.id,
          revision: source.revision + 1,
          amount: calculated.amount,
          currency: source.currency,
          breakdown: calculated.breakdown,
          terms: terms || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          status: "DRAFT",
        },
        include: {
          booking: {
            select: {
              bookingNumber: true,
              customer: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                },
              },
              service: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (source.status === "SENT") {
        await tx.notification.create({
          data: {
            userId: source.booking.customerId,
            title: "Quote updated",
            message: `Quote ${source.quoteNumber} has been withdrawn while SAMB prepares a revised quotation.`,
            type: "QUOTE_REVISED",
          },
        });
      }

      return {
        kind: "SUCCESS" as const,
        quote: revisedQuote,
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
        {
          message:
            "Only draft, sent, or expired quotes can be revised. Accepted, declined, or withdrawn quotes cannot be revised.",
        },
        { status: 409 }
      );
    }

    if (result.kind === "CANCELLED_BOOKING") {
      return NextResponse.json(
        { message: "Quotes for cancelled bookings cannot be revised." },
        { status: 409 }
      );
    }

    if (result.kind === "ALREADY_REVISED") {
      return NextResponse.json(
        {
          message:
            "This quote already has a revision. Start from the latest revision instead.",
        },
        { status: 409 }
      );
    }

    if (result.kind === "CONFLICT") {
      return NextResponse.json(
        { message: "The quote changed. Refresh the page and try again." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: `Draft revision ${result.quote.revision} created successfully.`,
        quote: result.quote,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message:
            "This quote has already been revised. Refresh the page and use the latest version.",
        },
        { status: 409 }
      );
    }

    console.error("Failed to revise quote:", error);

    return NextResponse.json(
      { message: "Unable to revise the quote right now." },
      { status: 500 }
    );
  }
}