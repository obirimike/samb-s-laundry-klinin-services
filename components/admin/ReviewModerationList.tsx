"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";

type ReviewStatus = "PENDING" | "PUBLISHED" | "HIDDEN";
type FilterStatus = "ALL" | ReviewStatus;

type AdminReview = {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  moderationNote: string | null;
  moderatedAt: string | null;
  createdAt: string;
  customer: {
    name: string;
    email: string;
  };
  service: {
    name: string;
  };
  booking: {
    bookingNumber: string;
    status: string;
    preferredDate: string;
    preferredTime: string;
  };
};

type Props = {
  initialReviews: AdminReview[];
};

const filters: FilterStatus[] = [
  "ALL",
  "PENDING",
  "PUBLISHED",
  "HIDDEN",
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function statusLabel(status: ReviewStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function ReviewModerationList({
  initialReviews,
}: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [notes, setNotes] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        initialReviews.map((review) => [
          review.id,
          review.moderationNote ?? "",
        ])
      ) as Record<string, string>
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    variant: "success",
    title: "",
    message: "",
  });

  const visibleReviews = useMemo(
    () =>
      reviews.filter(
        (review) => filter === "ALL" || review.status === filter
      ),
    [reviews, filter]
  );

  const counts = useMemo(
    () => ({
      ALL: reviews.length,
      PENDING: reviews.filter((r) => r.status === "PENDING").length,
      PUBLISHED: reviews.filter((r) => r.status === "PUBLISHED").length,
      HIDDEN: reviews.filter((r) => r.status === "HIDDEN").length,
    }),
    [reviews]
  );

  async function moderateReview(
    reviewId: string,
    status: "PUBLISHED" | "HIDDEN"
  ) {
    setBusyId(reviewId);

    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId,
          status,
          moderationNote: notes[reviewId] ?? "",
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || "Unable to update this review."
        );
      }

      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                status: payload.review.status as ReviewStatus,
                moderationNote: payload.review.moderationNote,
                moderatedAt: payload.review.moderatedAt,
              }
            : review
        )
      );

      setFeedback({
        isOpen: true,
        variant: "success",
        title: status === "PUBLISHED" ? "Review Published" : "Review Hidden",
        message:
          status === "PUBLISHED"
            ? "Review is now published and visible to the public."
            : "Review has been hidden from public service pages.",
      });
    } catch (error) {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Moderation Failed",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    const reviewId = deleteTarget.id;
    setBusyId(reviewId);

    try {
      const response = await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to delete review.");
      }

      setReviews((current) => current.filter((r) => r.id !== reviewId));
      setDeleteTarget(null);

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Review Removed",
        message: "The inappropriate review was permanently removed.",
      });
    } catch (error) {
      setDeleteTarget(null);
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Delete Failed",
        message:
          error instanceof Error ? error.message : "Failed to delete review.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-xl border p-4 text-left transition ${
              filter === item
                ? "border-blue-600 bg-blue-50/60 shadow-sm"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {item === "ALL" ? "All reviews" : statusLabel(item)}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {counts[item]}
            </p>
          </button>
        ))}
      </div>

      {visibleReviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No reviews in this view.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleReviews.map((review) => {
            const isBusy = busyId === review.id;

            return (
              <article
                key={review.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {review.customer.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {review.customer.email} · {review.service.name} (Booking {review.booking.bookingNumber})
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      review.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : review.status === "HIDDEN"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {statusLabel(review.status)}
                  </span>
                </div>

                <div className="mt-4">
                  <p
                    className="text-lg tracking-wide text-amber-500"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {"★".repeat(review.rating)}
                    <span className="text-slate-300">
                      {"★".repeat(5 - review.rating)}
                    </span>
                    <span className="ml-2 text-sm font-medium text-slate-700">
                      {review.rating}/5
                    </span>
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {review.comment || "The customer left a rating without a comment."}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-slate-800">
                      Booking date:
                    </span>{" "}
                    {formatDate(review.booking.preferredDate)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">
                      Review submitted:
                    </span>{" "}
                    {formatDateTime(review.createdAt)}
                  </p>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor={`moderation-note-${review.id}`}
                    className="mb-2 block text-sm font-medium text-slate-800"
                  >
                    Internal moderation note
                  </label>

                  <textarea
                    id={`moderation-note-${review.id}`}
                    value={notes[review.id] ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [review.id]: event.target.value,
                      }))
                    }
                    maxLength={2000}
                    rows={2}
                    placeholder="Optional note explaining the moderation decision"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {review.status !== "PUBLISHED" && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        moderateReview(review.id, "PUBLISHED")
                      }
                      className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 transition shadow-sm"
                    >
                      {isBusy ? "Saving..." : "Publish review"}
                    </button>
                  )}

                  {review.status !== "HIDDEN" && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => moderateReview(review.id, "HIDDEN")}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
                    >
                      {isBusy ? "Saving..." : "Hide review"}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => setDeleteTarget(review)}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60 transition"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Delete Review */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={executeDelete}
          title="Delete this review?"
          description={`Permanently remove the ${deleteTarget.rating}-star review from ${deleteTarget.customer.name} for ${deleteTarget.service.name}?`}
          consequences="This review will be permanently deleted from the database and will no longer affect service ratings."
          confirmText="Delete Review"
          isDestructive={true}
          isLoading={busyId === deleteTarget.id}
        />
      )}

      {/* Reusable Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
