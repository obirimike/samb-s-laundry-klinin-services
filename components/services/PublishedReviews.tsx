import { db } from "@/lib/db";

type Props = {
  serviceId: string;
};

function renderStars(rating: number) {
  return (
    <span
      className="tracking-wide text-amber-500"
      aria-label={`${rating} out of 5 stars`}
    >
      {"★".repeat(rating)}
      <span className="text-slate-300">
        {"★".repeat(5 - rating)}
      </span>
    </span>
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function PublishedReviews({
  serviceId,
}: Props) {
  const [summary, reviews] = await Promise.all([
    db.review.aggregate({
      where: {
        serviceId,
        status: "PUBLISHED",
      },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    }),

    db.review.findMany({
      where: {
        serviceId,
        status: "PUBLISHED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const totalReviews = summary._count._all;
  const averageRating = summary._avg.rating;

  return (
    <section
      aria-labelledby="service-reviews-heading"
      className="mt-12"
    >
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Customer feedback
        </p>

        <h2
          id="service-reviews-heading"
          className="mt-2 text-2xl font-bold text-slate-900"
        >
          Reviews and ratings
        </h2>

        {totalReviews > 0 && averageRating !== null && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold text-slate-900">
              {averageRating.toFixed(1)}
            </span>

            <span>
              {renderStars(Math.round(averageRating))}
            </span>

            <span className="text-sm text-slate-600">
              Based on {totalReviews}{" "}
              {totalReviews === 1 ? "review" : "reviews"}
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="font-medium text-slate-800">
            No published reviews yet
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Customer feedback will appear here after it has been reviewed
            and approved.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review: any) => {
            const firstName =
              review.customer.name.trim().split(/\s+/)[0] ||
              "Customer";

            return (
              <article
                key={review.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  {renderStars(review.rating)}

                  <time
                    dateTime={review.createdAt.toISOString()}
                    className="shrink-0 text-xs text-slate-500"
                  >
                    {formatDate(review.createdAt)}
                  </time>
                </div>

                {review.comment && (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {review.comment}
                  </p>
                )}

                <p className="mt-4 text-sm text-slate-800 font-semibold text-slate-900">
                  {firstName}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Completed service customer
                </p>
              </article>
            );
          })}
        </div>
      )}

      {totalReviews > reviews.length && (
        <p className="mt-4 text-sm text-slate-500">
          Showing the {reviews.length} most recent published reviews.
        </p>
      )}
    </section>
  );
}
