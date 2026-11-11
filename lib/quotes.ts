import { db } from "@/lib/db";

export async function expireSentQuotes(): Promise<number> {
  const now = new Date();
  let totalExpired = 0;

  // Process in batches so a large number of old quotes is manageable.
  while (true) {
    const candidates = await db.quote.findMany({
      where: {
        status: "SENT",
        expiresAt: {
          lte: now,
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
      take: 100,
      select: {
        id: true,
        quoteNumber: true,
        booking: {
          select: {
            bookingNumber: true,
            customerId: true,
          },
        },
        createdById: true,
      },
    });

    if (candidates.length === 0) {
      break;
    }

    let expiredInBatch = 0;

    for (const quote of candidates) {
      const changed = await db.$transaction(async (tx: any ) => {
        // Conditional update prevents duplicate expiry notifications
        // if two requests try to expire the same quote concurrently.
        const result = await tx.quote.updateMany({
          where: {
            id: quote.id,
            status: "SENT",
            expiresAt: {
              lte: now,
            },
          },
          data: {
            status: "EXPIRED",
          },
        });

        if (result.count !== 1) {
          return false;
        }

        const notifications = [
          {
            userId: quote.booking.customerId,
            title: "Quote expired",
            message: `Quote ${quote.quoteNumber} for booking ${quote.booking.bookingNumber} has expired. Contact SAMB if you need an updated quote.`,
            type: "QUOTE_EXPIRED",
          },
          {
            userId: quote.createdById,
            title: "Customer quote expired",
            message: `Quote ${quote.quoteNumber} for booking ${quote.booking.bookingNumber} has expired.`,
            type: "QUOTE_EXPIRED",
          },
        ];

        await tx.notification.createMany({
          data: notifications,
        });

        return true;
      });

      if (changed) {
        expiredInBatch += 1;
      }
    }

    totalExpired += expiredInBatch;

    // Avoid an infinite loop if concurrent updates leave no
    // candidates that this process can successfully change.
    if (expiredInBatch === 0) {
      break;
    }
  }

  return totalExpired;
}