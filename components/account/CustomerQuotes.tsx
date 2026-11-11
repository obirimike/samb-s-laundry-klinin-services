"use client";

import { useMemo, useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";

type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "WITHDRAWN";

type QuoteLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type QuoteRecord = {
  id: string;
  quoteNumber: string;
  revision: number;
  previousQuoteId: string | null;
  amount: string;
  currency: string;
  status: QuoteStatus;
  breakdown: unknown;
  terms: string | null;
  createdAt: string;
  sentAt: string | null;
  expiresAt: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  booking: {
    bookingNumber: string;
    status: string;
    preferredDate: string;
    preferredTime: string;
    service: {
      name: string;
      category: string;
    };
  };
};

type Props = {
  initialQuotes: QuoteRecord[];
};

const statusStyles: Record<QuoteStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-emerald-100 text-emerald-800",
  DECLINED: "bg-rose-100 text-rose-800",
  EXPIRED: "bg-amber-100 text-amber-800",
  WITHDRAWN: "bg-gray-100 text-gray-700",
};

function money(amount: number | string, currency: string) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function dateLabel(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function readLineItems(value: unknown): QuoteLine[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const row = item as Record<string, unknown>;

    const quantity = Number(row.quantity);
    const unitPrice = Number(row.unitPrice);
    const total = Number(row.total);

    if (
      typeof row.description !== "string" ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(unitPrice) ||
      !Number.isFinite(total)
    ) {
      return [];
    }

    return [
      {
        description: row.description,
        quantity,
        unitPrice,
        total,
      },
    ];
  });
}

export default function CustomerQuotes({ initialQuotes }: Props) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyQuoteId, setBusyQuoteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Modals
  const [confirmTarget, setConfirmTarget] = useState<{
    quote: QuoteRecord;
    decision: "ACCEPT" | "DECLINE";
  } | null>(null);

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
    referenceNumber?: string;
  }>({
    isOpen: false,
    variant: "success",
    title: "",
    message: "",
  });

  const pendingCount = useMemo(
    () => quotes.filter((quote) => quote.status === "SENT").length,
    [quotes]
  );

  function currentStatus(quote: QuoteRecord): QuoteStatus {
    return quote.status;
  }

  function respond(quote: QuoteRecord, decision: "ACCEPT" | "DECLINE") {
    const note = (notes[quote.id] ?? "").trim();
    if (note.length > 1000) {
      setError("Your message must be 1,000 characters or fewer.");
      return;
    }
    setConfirmTarget({ quote, decision });
  }

  async function executeResponse() {
    if (!confirmTarget) return;
    const { quote, decision } = confirmTarget;
    setConfirmTarget(null);

    const note = (notes[quote.id] ?? "").trim();
    setError("");
    setMessage("");
    setBusyQuoteId(quote.id);

    try {
      const response = await fetch(
        `/api/account/quotes/${quote.id}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            ...(note ? { note, responseNote: note } : {}),
          }),
        }
      );

      const result = (await response.json()) as {
        message?: string;
        status?: QuoteStatus;
      };

      if (!response.ok || !result.status) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Submission Failed",
          message: result.message || "Unable to submit your quote response.",
        });
        return;
      }

      setQuotes((current) =>
        current.map((item) =>
          item.id === quote.id
            ? {
                ...item,
                status: result.status!,
                respondedAt: new Date().toISOString(),
                responseNote: note || null,
              }
            : item
        )
      );

      setNotes((current) => ({
        ...current,
        [quote.id]: "",
      }));

      const isAccepted = decision === "ACCEPT";

      setFeedback({
        isOpen: true,
        variant: "success",
        title: isAccepted ? "Quote Accepted" : "Quote Declined",
        message: isAccepted
          ? "Your quote response has been recorded successfully. SAMB will follow up regarding your booking confirmation."
          : "Your decision has been recorded. Our team will review your response.",
        referenceNumber: quote.quoteNumber,
      });
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setBusyQuoteId(null);
    }
  }

  return (
    <div className="space-y-7">
      <header className="rounded-2xl bg-gradient-to-r from-blue-800 to-indigo-700 p-6 text-white sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
          Your account
        </p>
        <h1 className="mt-2 text-3xl font-bold">My quotations</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
          Review your service estimates, check the itemized costs, and respond to quotations from SAMB&apos;s Laundry and Klinin Services.
        </p>
        <div className="mt-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
          {pendingCount} awaiting your response
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {message}
        </div>
      )}

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-700">
            ₵
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            No quotations yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            When SAMB sends a quotation for one of your bookings, it will appear
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {quotes.map((quote) => {
            const status = currentStatus(quote);
            const items = readLineItems(quote.breakdown);
            const canRespond = status === "SENT";
            const isBusy = busyQuoteId === quote.id;

            return (
              <article
                key={quote.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {quote.quoteNumber}
                      <span className="ml-2 text-sm font-medium text-slate-500">
                        Revision {quote.revision}
                      </span>
                    </h2>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">
                      {quote.booking.service.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Booking {quote.booking.bookingNumber}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Requested service date:{" "}
                      {dateLabel(quote.booking.preferredDate)}
                    </p>
                  </div>

                  <div className="flex flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[status]
                      }`}
                    >
                      {titleCase(status)}
                    </span>
                    <p className="text-2xl font-bold text-slate-900">
                      {money(quote.amount, quote.currency)}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Quote issued
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {dateLabel(quote.sentAt)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Quote valid until
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {dateLabel(quote.expiresAt)}
                      </p>
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-bold text-slate-900">
                        Cost breakdown
                      </h3>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-4 py-3 font-semibold">
                                Description
                              </th>
                              <th className="px-4 py-3 font-semibold">
                                Qty
                              </th>
                              <th className="px-4 py-3 text-right font-semibold">
                                Unit price
                              </th>
                              <th className="px-4 py-3 text-right font-semibold">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {items.map((item, index) => (
                              <tr key={`${quote.id}-item-${index}`}>
                                <td className="px-4 py-3 text-slate-800">
                                  {item.description}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {item.quantity}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                                  {money(item.unitPrice, quote.currency)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                                  {money(item.total, quote.currency)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {quote.terms && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Terms and conditions
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {quote.terms}
                      </p>
                    </div>
                  )}

                  {quote.responseNote && (
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-800">
                        Your response note
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {quote.responseNote}
                      </p>
                    </div>
                  )}

                  {canRespond && (
                    <div className="border-t border-slate-200 pt-5">
                      <div className="w-full max-w-xl space-y-3">
                        <div>
                          <label
                            htmlFor={`note-${quote.id}`}
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            Message to SAMB{" "}
                            <span className="font-normal text-slate-400">
                              (optional)
                            </span>
                          </label>

                          <textarea
                            id={`note-${quote.id}`}
                            rows={3}
                            maxLength={1000}
                            value={notes[quote.id] || ""}
                            onChange={(event) =>
                              setNotes((current) => ({
                                ...current,
                                [quote.id]: event.target.value,
                              }))
                            }
                            placeholder="Add a question, explain your decision, or request a preferred service date..."
                            className="w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />

                          <p className="mt-1 text-xs text-slate-500">
                            {(notes[quote.id] ?? "").length} / 1,000 characters
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => respond(quote, "DECLINE")}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? "Processing..." : "Decline"}
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => respond(quote, "ACCEPT")}
                            className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? "Processing..." : "Accept quote"}
                          </button>
                        </div>

                        <p className="text-xs leading-5 text-slate-500">
                          Responding records your decision. It does not itself
                          confirm the booking or record payment.
                        </p>
                      </div>
                    </div>
                  )}

                  {status === "EXPIRED" && (
                    <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      This quote has expired. Please contact SAMB if you need a
                      revised quotation.
                    </p>
                  )}

                  {status === "ACCEPTED" && (
                    <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      You accepted this quote on {dateLabel(quote.respondedAt)}.
                      SAMB will follow up regarding booking confirmation.
                    </p>
                  )}

                  {status === "DECLINED" && (
                    <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
                      You declined this quote on {dateLabel(quote.respondedAt)}.
                    </p>
                  )}

                  {status === "WITHDRAWN" && (
                    <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                      This quote is no longer available.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Quote Decision */}
      {confirmTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setConfirmTarget(null)}
          onConfirm={executeResponse}
          title={
            confirmTarget.decision === "ACCEPT"
              ? "Accept this quotation?"
              : "Decline this quotation?"
          }
          description={
            confirmTarget.decision === "ACCEPT"
              ? `You are accepting quotation ${confirmTarget.quote.quoteNumber} for booking ${confirmTarget.quote.booking.bookingNumber} (${money(confirmTarget.quote.amount, confirmTarget.quote.currency)}).`
              : `You are declining quotation ${confirmTarget.quote.quoteNumber}. You can include feedback for the SAMB team in the message field.`
          }
          recordName={confirmTarget.quote.quoteNumber}
          confirmText={
            confirmTarget.decision === "ACCEPT" ? "Accept Quotation" : "Decline Quotation"
          }
          isDestructive={confirmTarget.decision === "DECLINE"}
          isLoading={busyQuoteId === confirmTarget.quote.id}
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        referenceNumber={feedback.referenceNumber}
        referenceLabel="Quotation"
      />
    </div>
  );
}