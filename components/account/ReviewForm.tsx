"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
  bookingNumber: string;
};

export default function ReviewForm({
  bookingId,
  bookingNumber,
}: Props) {
  const router = useRouter();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/account/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          rating,
          ...(comment.trim() ? { comment: comment.trim() } : {}),
        }),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setError(result.message || "Unable to submit your review.");
        return;
      }

      setSuccess(
        result.message ||
          "Thank you! Your review is awaiting moderation."
      );

      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submitReview} className="mt-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">
          Rate your experience
        </p>

        <div
          className="mt-2 flex gap-2"
          role="radiogroup"
          aria-label="Service rating"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
              onClick={() => setRating(value)}
              className={`text-3xl transition ${
                value <= rating
                  ? "text-amber-400"
                  : "text-slate-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {rating} out of 5 stars
        </p>
      </div>

      <div>
        <label
          htmlFor={`review-${bookingId}`}
          className="mb-1.5 block text-sm font-semibold text-slate-800"
        >
          Your feedback (optional)
        </label>

        <textarea
          id={`review-${bookingId}`}
          rows={4}
          maxLength={2000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Tell us about your experience with SAMB..."
          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <p className="mt-1 text-right text-xs text-slate-500">
          {comment.length}/2,000 characters
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Submitting..." : `Submit review for ${bookingNumber}`}
      </button>
    </form>
  );
}
