import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { expireSentQuotes } from "@/lib/quotes";
import nextDynamic from "next/dynamic";
import Skeleton from "@/components/ui/Skeleton";

const CustomerQuotes = nextDynamic(
  () => import("@/components/account/CustomerQuotes"),
  {
    loading: () => (
      <div className="space-y-6">
        <header className="rounded-2xl bg-gradient-to-r from-blue-800 to-indigo-700 p-6 text-white sm:p-8 space-y-3">
          <Skeleton className="h-4 w-28 rounded" variant="glass" />
          <Skeleton className="h-8 w-60 rounded-xl" variant="glass" />
          <Skeleton className="h-4 w-96 max-w-full rounded" variant="glass" />
        </header>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    ),
  }
);

export const dynamic = "force-dynamic";

export default async function AccountQuotesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/quotes");
  }

  if (session.user.role !== "CUSTOMER") {
    redirect("/admin/quotes");
  }

  await expireSentQuotes();

  const quotes = await db.quote.findMany({
    where: {
      booking: {
        is: {
          customerId: session.user.id,
        },
      },
      status: {
        in: ["SENT", "ACCEPTED", "DECLINED", "EXPIRED", "WITHDRAWN"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      booking: {
        select: {
          bookingNumber: true,
          status: true,
          preferredDate: true,
          preferredTime: true,
          service: {
            select: {
              name: true,
              category: true,
            },
          },
        },
      },
    },
  });

  const now = new Date();

  const initialQuotes = quotes.map((quote: any) => {
    const isExpired =
      quote.status === "SENT" &&
      quote.expiresAt &&
      quote.expiresAt <= now;

    return {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      revision: quote.revision,
      previousQuoteId: quote.previousQuoteId,
      amount: quote.amount.toString(),
      currency: quote.currency,
      status: isExpired ? ("EXPIRED" as const) : quote.status,
      breakdown: quote.breakdown,
      terms: quote.terms,
      createdAt: quote.createdAt.toISOString(),
      sentAt: quote.sentAt?.toISOString() ?? null,
      expiresAt: quote.expiresAt?.toISOString() ?? null,
      respondedAt: quote.respondedAt?.toISOString() ?? null,
      responseNote: quote.responseNote,
      booking: {
        bookingNumber: quote.booking.bookingNumber,
        status: quote.booking.status,
        preferredDate: quote.booking.preferredDate.toISOString(),
        preferredTime: quote.booking.preferredTime,
        service: quote.booking.service,
      },
    };
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <CustomerQuotes initialQuotes={initialQuotes} />
    </main>
  );
}