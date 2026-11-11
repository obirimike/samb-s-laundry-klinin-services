import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import ReviewModerationList from "@/components/admin/ReviewModerationList";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect(
      session.user.role === "STAFF" ? "/staff" : "/account"
    );
  }

  const reviews = await db.review.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
      booking: {
        select: {
          bookingNumber: true,
          status: true,
          preferredDate: true,
          preferredTime: true,
        },
      },
    },
  });

  const initialReviews = reviews.map((review: any) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    moderationNote: review.moderationNote,
    moderatedAt: review.moderatedAt?.toISOString() ?? null,
    createdAt: review.createdAt.toISOString(),
    customer: {
      name: review.customer.name,
      email: review.customer.email,
    },
    service: {
      name: review.service.name,
    },
    booking: {
      bookingNumber: review.booking.bookingNumber,
      status: review.booking.status,
      preferredDate: review.booking.preferredDate.toISOString(),
      preferredTime: review.booking.preferredTime,
    },
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Admin dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Customer reviews
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Review customer feedback, publish appropriate reviews, or hide
            reviews that should not appear publicly.
          </p>
        </div>

        <ReviewModerationList initialReviews={initialReviews} />
      </div>
    </main>
  );
}
