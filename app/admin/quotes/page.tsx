import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import nextDynamic from "next/dynamic";
import Skeleton from "@/components/ui/Skeleton";
import { expireSentQuotes } from "@/lib/quotes";

const QuoteManagement = nextDynamic(
  () => import("@/components/admin/QuoteManagement"),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-10 w-44 rounded-xl bg-blue-900/30" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    ),
  }
);

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  await expireSentQuotes();

  const [quotes, bookings] = await Promise.all([
    db.quote.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            preferredDate: true,
            preferredTime: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            service: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    db.booking.findMany({
      where: {
        status: { not: "CANCELLED" },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        preferredDate: true,
        preferredTime: true,
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    }),
  ]);

  const initialQuotes = quotes.map((quote: any) => ({
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    revision: quote.revision,
    previousQuoteId: quote.previousQuoteId,
    amount: quote.amount.toString(),
    currency: quote.currency,
    status: quote.status,
    terms: quote.terms,
    breakdown: quote.breakdown,
    responseNote: quote.responseNote,
    createdAt: quote.createdAt.toISOString(),
    expiresAt: quote.expiresAt?.toISOString() ?? null,
    sentAt: quote.sentAt?.toISOString() ?? null,
    respondedAt: quote.respondedAt?.toISOString() ?? null,
    booking: {
      id: quote.booking.id,
      bookingNumber: quote.booking.bookingNumber,
      status: quote.booking.status,
      preferredDate: quote.booking.preferredDate.toISOString(),
      preferredTime: quote.booking.preferredTime,
      customer: quote.booking.customer,
      service: quote.booking.service,
    },
    createdBy: quote.createdBy,
  }));

  const availableBookings = bookings.map((booking: any) => ({
    ...booking,
    preferredDate: booking.preferredDate.toISOString(),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <QuoteManagement
        initialQuotes={initialQuotes}
        bookings={availableBookings}
      />
    </main>
  );
}
