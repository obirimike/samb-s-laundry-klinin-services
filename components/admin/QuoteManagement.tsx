"use client";

import { useMemo, useState, type FormEvent } from "react";
import WhatsAppButton from "@/components/admin/WhatsAppButton";
import { buildQuoteWhatsAppMessage } from "@/lib/whatsapp";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";

type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "WITHDRAWN";

type BookingOption = {
  id: string;
  bookingNumber: string;
  status: string;
  preferredDate: string;
  preferredTime: string;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
  };
  service: {
    name: string;
    category: string;
  };
};

type QuoteRecord = {
  id: string;
  quoteNumber: string;
  revision: number;
  previousQuoteId: string | null;
  amount: string | number;
  currency: string;
  status: QuoteStatus;
  terms: string | null;
  breakdown: unknown;
  createdAt: string;
  expiresAt: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  booking: {
    id: string;
    bookingNumber: string;
    status: string;
    preferredDate: string;
    preferredTime: string;
    customer: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
    };
    service: {
      name: string;
      category: string;
    };
  };
  createdBy: {
    id: string;
    name: string | null;
  };
};

type FormLineItem = {
  rowId: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

type Props = {
  initialQuotes: QuoteRecord[];
  bookings: BookingOption[];
};

const statuses: QuoteStatus[] = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "DECLINED",
  "EXPIRED",
  "WITHDRAWN",
];

const statusStyles: Record<QuoteStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-emerald-100 text-emerald-800",
  DECLINED: "bg-rose-100 text-rose-800",
  EXPIRED: "bg-amber-100 text-amber-800",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};

function formatMoney(amount: number | string, currency = "GHS") {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";

  return new Date(value).toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  });
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );
}

/** Returns true when an ISO date string (YYYY-MM-DD) refers to a date that has not yet passed. */
function isoDateIsFuture(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(`${dateStr}T23:59:59.000Z`).getTime() > Date.now();
}

export default function QuoteManagement({
  initialQuotes,
  bookings,
}: Props) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState("");
  const [revisionSourceId, setRevisionSourceId] = useState<string | null>(null);
  const [terms, setTerms] = useState(
    "50% upfront and 50% on completion."
  );
  const [expiresAt, setExpiresAt] = useState("");
  const [items, setItems] = useState<FormLineItem[]>([
    {
      rowId: 1,
      description: "",
      quantity: "1",
      unitPrice: "",
    },
  ]);
  const [nextRowId, setNextRowId] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sendingQuoteId, setSendingQuoteId] = useState<string | null>(null);
  const [withdrawingQuoteId, setWithdrawingQuoteId] = useState<string | null>(null);
  const [viewingResponseQuoteId, setViewingResponseQuoteId] =
    useState<string | null>(null);

  // Modal states
  const [confirmSendQuote, setConfirmSendQuote] = useState<QuoteRecord | null>(null);
  const [confirmWithdrawQuote, setConfirmWithdrawQuote] = useState<QuoteRecord | null>(null);
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

  async function executeSendQuote(quote: QuoteRecord) {
    setConfirmSendQuote(null);
    setError("");
    setSuccess("");
    setSendingQuoteId(quote.id);

    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}/send`, {
        method: "POST",
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Failed to Send Quote",
          message: result.message || "Unable to send this quote.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Quote Sent Successfully",
        message:
          result.message ||
          `Quote ${quote.quoteNumber} has been sent to the customer for review and acceptance.`,
        referenceNumber: quote.quoteNumber,
      });

      const refreshResponse = await fetch("/api/admin/quotes", {
        cache: "no-store",
      });

      if (refreshResponse.ok) {
        const refreshed = (await refreshResponse.json()) as {
          quotes: QuoteRecord[];
        };
        setQuotes(refreshed.quotes);
      }
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "A network error occurred while sending the quote. Please try again.",
      });
    } finally {
      setSendingQuoteId(null);
    }
  }

  async function executeWithdrawQuote(quote: QuoteRecord) {
    setConfirmWithdrawQuote(null);
    setError("");
    setSuccess("");
    setWithdrawingQuoteId(quote.id);

    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WITHDRAWN" }),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Withdrawal Failed",
          message: result.message || "Unable to withdraw this quote.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Quote Withdrawn",
        message:
          result.message ||
          `Quote ${quote.quoteNumber} has been withdrawn and will no longer be open for customer acceptance.`,
        referenceNumber: quote.quoteNumber,
      });

      const refreshResponse = await fetch("/api/admin/quotes", {
        cache: "no-store",
      });

      if (refreshResponse.ok) {
        const refreshed = (await refreshResponse.json()) as {
          quotes: QuoteRecord[];
        };
        setQuotes(refreshed.quotes);
      }
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "Failed to connect to the server. Please try again.",
      });
    } finally {
      setWithdrawingQuoteId(null);
    }
  }

  const stats = useMemo(
    () => ({
      total: quotes.length,
      drafts: quotes.filter((quote) => quote.status === "DRAFT").length,
      sent: quotes.filter((quote) => quote.status === "SENT").length,
      accepted: quotes.filter((quote) => quote.status === "ACCEPTED").length,
    }),
    [quotes]
  );

  const filteredQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return quotes.filter((quote) => {
      const matchesStatus =
        statusFilter === "ALL" || quote.status === statusFilter;

      const matchesSearch =
        !query ||
        [
          quote.quoteNumber,
          quote.booking.bookingNumber,
          quote.booking.customer.name,
          quote.booking.customer.email,
          quote.booking.service.name,
        ].some((value) => value.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [quotes, search, statusFilter]);

  const quoteIdsWithRevisions = useMemo(
    () =>
      new Set(
        quotes
          .map((quote) => quote.previousQuoteId)
          .filter((id): id is string => Boolean(id))
      ),
    [quotes]
  );

  function startRevision(quote: QuoteRecord) {
    const rawItems = Array.isArray(quote.breakdown)
      ? quote.breakdown.filter(
          (item): item is Record<string, unknown> =>
            typeof item === "object" &&
            item !== null &&
            !Array.isArray(item)
        )
      : [];

    const baseRowId = nextRowId;

    const preparedItems: FormLineItem[] = rawItems.map((item, index) => ({
      rowId: baseRowId + index,
      description:
        typeof item.description === "string" ? item.description : "",
      quantity: String(item.quantity ?? "1"),
      unitPrice: String(item.unitPrice ?? ""),
    }));

    if (preparedItems.length === 0) {
      preparedItems.push({
        rowId: baseRowId,
        description: "",
        quantity: "1",
        unitPrice: "",
      });
    }

    setItems(preparedItems);
    setNextRowId(baseRowId + preparedItems.length);
    setRevisionSourceId(quote.id);
    setSelectedBooking(quote.booking.id);
    setTerms(quote.terms ?? "");

    const expiryDate = quote.expiresAt?.slice(0, 10) ?? "";
    setExpiresAt(isoDateIsFuture(expiryDate) ? expiryDate : "");
    setError("");
    setSuccess(
      `Preparing revision ${quote.revision + 1} of ${quote.quoteNumber}.`
    );

    document
      .getElementById("quote-creation-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelRevision() {
    setRevisionSourceId(null);
    setSelectedBooking("");
    setTerms("50% upfront and 50% on completion.");
    setExpiresAt("");
    setItems([
      {
        rowId: nextRowId,
        description: "",
        quantity: "1",
        unitPrice: "",
      },
    ]);
    setNextRowId((current) => current + 1);
    setError("");
    setSuccess("");
  }

  const estimatedTotal = items.reduce((total, item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(unitPrice) ||
      quantity <= 0 ||
      unitPrice < 0
    ) {
      return total;
    }

    return total + quantity * unitPrice;
  }, 0);

  function updateItem(
    rowId: number,
    field: keyof Omit<FormLineItem, "rowId">,
    value: string
  ) {
    setItems((current) =>
      current.map((item) =>
        item.rowId === rowId ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        rowId: nextRowId,
        description: "",
        quantity: "1",
        unitPrice: "",
      },
    ]);

    setNextRowId((current) => current + 1);
  }

  function removeItem(rowId: number) {
    setItems((current) => current.filter((item) => item.rowId !== rowId));
  }

  async function handleCreateQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!revisionSourceId && !selectedBooking) {
      setError("Please select a booking.");
      return;
    }

    if (items.length === 0) {
      setError("Add at least one cost item.");
      return;
    }

    const invalidItem = items.some((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      return (
        !item.description.trim() ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0 ||
        !Number.isSafeInteger(Math.round(unitPrice * 100))
      );
    });

    if (invalidItem) {
      setError(
        "Enter a description, a whole-number quantity, and a valid unit price for every item."
      );
      return;
    }

    if (estimatedTotal <= 0) {
      setError("The total quote amount must be greater than zero.");
      return;
    }

    let expiryIso: string | undefined;

    if (expiresAt) {
      // Treat the selected expiry day as ending at 23:59:59 UTC.
      expiryIso = `${expiresAt}T23:59:59.000Z`;

      if (new Date(expiryIso).getTime() <= Date.now()) {
        setError("Choose an expiry date in the future.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint = revisionSourceId
        ? `/api/admin/quotes/${revisionSourceId}/revise`
        : "/api/admin/quotes";

      const payload = {
        ...(revisionSourceId ? {} : { bookingId: selectedBooking }),
        items: items.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
        terms: terms.trim() || undefined,
        expiresAt: expiryIso,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        message?: string;
        errors?: unknown;
      };

      if (!response.ok) {
        setError(result.message || "Unable to create the quote.");
        return;
      }

      setSuccess(result.message || "Draft quote created successfully.");
      setFeedback({
        isOpen: true,
        variant: "success",
        title: revisionSourceId ? "Quote Revision Created" : "Quote Draft Created",
        message:
          result.message ||
          (revisionSourceId
            ? "The quotation revision has been prepared and is ready for review."
            : "The draft quotation has been saved successfully."),
      });
      setRevisionSourceId(null);
      setSelectedBooking("");
      setTerms("50% upfront and 50% on completion.");
      setExpiresAt("");
      setItems([
        {
          rowId: nextRowId,
          description: "",
          quantity: "1",
          unitPrice: "",
        },
      ]);
      setNextRowId((current) => current + 1);

      // Reload the authoritative list from the server.
      const refreshResponse = await fetch("/api/admin/quotes", {
        cache: "no-store",
      });

      if (refreshResponse.ok) {
        const refreshed = (await refreshResponse.json()) as {
          quotes: QuoteRecord[];
        };

        setQuotes(refreshed.quotes);
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const responseQuote =
    quotes.find((quote) => quote.id === viewingResponseQuoteId) ?? null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-700">
            Admin workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 ">
            Quotes &amp; Pricing
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Prepare clear, itemized service quotations for customers and track
            their current status.
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span className="font-semibold">Currency:</span> Ghana cedi (GHS)
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 text-black">
        {[
          { label: "All quotes", value: stats.total },
          { label: "Drafts", value: stats.drafts },
          { label: "Sent", value: stats.sent },
          { label: "Accepted", value: stats.accepted },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Quote records</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by quote, booking, customer, or service.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search quotes..."
                aria-label="Search quotes"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredQuotes.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                ₵
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">
                {quotes.length === 0 ? "No quotes created yet" : "No matches found"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {quotes.length === 0
                  ? "Choose a booking and prepare your first quotation using the form."
                  : "Try another search term or choose a different status filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Quote</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="align-top hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {quote.quoteNumber}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Revision {quote.revision}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {quote.booking.bookingNumber}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {quote.booking.service.name}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {quote.booking.customer.name}
                        </p>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {quote.booking.customer.email}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        {formatMoney(quote.amount, quote.currency)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusStyles[quote.status]
                          }`}
                        >
                          {statusLabel(quote.status)}
                        </span>
                        {quote.expiresAt && (
                          <p className="mt-2 whitespace-nowrap text-xs text-slate-500">
                            Expires {formatDate(quote.expiresAt)}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(quote.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <WhatsAppButton
                            phone={quote.booking.customer.phone}
                            message={buildQuoteWhatsAppMessage({
                              customerName: quote.booking.customer.name,
                              quoteNumber: quote.quoteNumber,
                              bookingNumber: quote.booking.bookingNumber,
                              status: quote.status,
                            })}
                            variant="compact"
                            label="WhatsApp"
                          />
                          {(quote.status === "DRAFT" ||
                            quote.status === "SENT") && (
                            <>
                              <button
                                type="button"
                                onClick={() => setConfirmSendQuote(quote)}
                                disabled={
                                  sendingQuoteId !== null || isSubmitting
                                }
                                className="whitespace-nowrap rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition"
                              >
                                {sendingQuoteId === quote.id
                                  ? "Sending..."
                                  : quote.status === "DRAFT"
                                    ? "Send quote"
                                    : "Resend email"}
                              </button>

                              <button
                                type="button"
                                onClick={() => setConfirmWithdrawQuote(quote)}
                                disabled={
                                  withdrawingQuoteId !== null || isSubmitting
                                }
                                className="whitespace-nowrap rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition"
                              >
                                {withdrawingQuoteId === quote.id ? "Withdrawing..." : "Withdraw"}
                              </button>
                            </>
                          )}

                          {(quote.status === "DRAFT" ||
                            quote.status === "SENT" ||
                            quote.status === "EXPIRED") &&
                            quote.booking.status !== "CANCELLED" &&
                            !quoteIdsWithRevisions.has(quote.id) && (
                              <button
                                type="button"
                                onClick={() => startRevision(quote)}
                                disabled={
                                  isSubmitting || sendingQuoteId !== null
                                }
                                className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Revise
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => setViewingResponseQuoteId(quote.id)}
                            className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
                          >
                            View response
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            Showing {filteredQuotes.length} of {quotes.length} quotes
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <p className="text-sm font-semibold text-blue-700">
              Create a quotation
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {revisionSourceId
                ? `Revise ${
                    quotes.find((quote) => quote.id === revisionSourceId)
                      ?.quoteNumber ?? "quote"
                  }`
                : "New draft quote"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Select a booking, enter each cost item, and save the draft for
              review.
            </p>
          </div>

          <form
            id="quote-creation-form"
            onSubmit={handleCreateQuote}
            className="space-y-5 p-5 sm:p-6"
          >
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                {success}
              </div>
            )}

            <div>
              <label
                htmlFor="bookingId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Booking
              </label>

              <select
                id="bookingId"
                required
                disabled={Boolean(revisionSourceId)}
                value={selectedBooking}
                onChange={(event) => setSelectedBooking(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="">Select a booking</option>
                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.bookingNumber} — {booking.customer.name} —{" "}
                    {booking.service.name}
                  </option>
                ))}
              </select>

              {bookings.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  There are no eligible bookings to quote.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Itemized costs
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  + Add item
                </button>
              </div>

              {items.map((item, index) => (
                <div
                  key={item.rowId}
                  className="space-y-3 rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Item {index + 1}
                    </p>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.rowId)}
                        className="text-xs font-medium text-rose-600 hover:text-rose-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`description-${item.rowId}`}
                      className="mb-1.5 block text-xs font-medium text-slate-600"
                    >
                      Description
                    </label>
                    <input
                      id={`description-${item.rowId}`}
                      required
                      maxLength={200}
                      value={item.description}
                      onChange={(event) =>
                        updateItem(
                          item.rowId,
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Deep cleaning"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor={`quantity-${item.rowId}`}
                        className="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        Quantity
                      </label>
                      <input
                        id={`quantity-${item.rowId}`}
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.rowId, "quantity", event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`price-${item.rowId}`}
                        className="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        Unit price (GHS)
                      </label>
                      <input
                        id={`price-${item.rowId}`}
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unitPrice}
                        onChange={(event) =>
                          updateItem(
                            item.rowId,
                            "unitPrice",
                            event.target.value
                          )
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-3 text-sm">
                    <span className="text-slate-500">Line total</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(
                        Math.max(0, Number(item.quantity) || 0) *
                          Math.max(0, Number(item.unitPrice) || 0)
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-slate-900 p-4 text-white">
              <p className="text-sm text-slate-300">Estimated quote total</p>
              <p className="mt-1 text-3xl font-bold">
                {formatMoney(estimatedTotal)}
              </p>
              <p className="mt-2 text-xs text-slate-300">
                The server recalculates the actual saved total.
              </p>
            </div>

            <div>
              <label
                htmlFor="expiresAt"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Quote expiry date <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="expiresAt"
                type="date"
                min={new Date().toLocaleDateString("en-CA", {
                  timeZone: "UTC",
                })}
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="terms"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Terms and conditions
              </label>
              <textarea
                id="terms"
                rows={3}
                maxLength={5000}
                value={terms}
                onChange={(event) => setTerms(event.target.value)}
                placeholder="Payment terms, exclusions, or other conditions..."
                className="w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm leading-6 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isSubmitting || bookings.length === 0}
                className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Saving..."
                  : revisionSourceId
                    ? "Save revised draft"
                    : "Create draft quote"}
              </button>

              {revisionSourceId && (
                <button
                  type="button"
                  onClick={cancelRevision}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel revision
                </button>
              )}
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Creating this draft does not send an email, confirm the booking,
              or record a payment.
            </p>
          </form>
        </section>
      </div>

      {responseQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setViewingResponseQuoteId(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-response-title"
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Customer response
                </p>
                <h2
                  id="quote-response-title"
                  className="mt-2 text-xl font-bold text-slate-900"
                >
                  {responseQuote.quoteNumber}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Booking {responseQuote.booking.bookingNumber}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close response dialog"
                onClick={() => setViewingResponseQuoteId(null)}
                className="rounded-lg p-2 text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Customer</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {responseQuote.booking.customer.name}
                  </p>
                  <p className="mt-1 break-all text-sm text-slate-500">
                    {responseQuote.booking.customer.email}
                  </p>
                  {responseQuote.booking.customer.phone && (
                    <p className="mt-1 text-sm text-slate-600">
                      {responseQuote.booking.customer.phone}
                    </p>
                  )}
                  <div className="mt-3">
                    <WhatsAppButton
                      phone={responseQuote.booking.customer.phone}
                      message={buildQuoteWhatsAppMessage({
                        customerName: responseQuote.booking.customer.name,
                        quoteNumber: responseQuote.quoteNumber,
                        bookingNumber: responseQuote.booking.bookingNumber,
                        status: responseQuote.status,
                      })}
                      showHelperText
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Quote amount</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatMoney(
                      responseQuote.amount,
                      responseQuote.currency
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {responseQuote.booking.service.name}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Decision
                </p>

                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[responseQuote.status]
                    }`}
                  >
                    {statusLabel(responseQuote.status)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Response date and time
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatDateTime(responseQuote.respondedAt)}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Customer&apos;s message
                </p>

                <div className="mt-2 min-h-24 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {responseQuote.responseNote?.trim() ? (
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {responseQuote.responseNote}
                    </p>
                  ) : (
                    <p className="text-sm italic text-slate-500">
                      {responseQuote.respondedAt
                        ? "The customer did not include a message."
                        : "No customer response has been recorded yet."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setViewingResponseQuoteId(null)}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Confirmation Modal: Send Quote */}
      {confirmSendQuote && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setConfirmSendQuote(null)}
          onConfirm={() => executeSendQuote(confirmSendQuote)}
          title="Send quotation to customer?"
          description={`Send quote ${confirmSendQuote.quoteNumber} for booking ${confirmSendQuote.booking.bookingNumber} to ${confirmSendQuote.booking.customer.name} (${confirmSendQuote.booking.customer.email})?`}
          consequences="The quote status will change to SENT and the customer will be able to review and respond to it."
          recordName={confirmSendQuote.quoteNumber}
          confirmText="Send Quotation"
          isLoading={sendingQuoteId === confirmSendQuote.id}
        />
      )}

      {/* Confirmation Modal: Withdraw Quote */}
      {confirmWithdrawQuote && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setConfirmWithdrawQuote(null)}
          onConfirm={() => executeWithdrawQuote(confirmWithdrawQuote)}
          title="Withdraw this quotation?"
          description={`Withdraw quotation ${confirmWithdrawQuote.quoteNumber} for booking ${confirmWithdrawQuote.booking.bookingNumber}?`}
          consequences="The customer will no longer be able to accept or decline this quotation. You can create a new revision later if needed."
          recordName={confirmWithdrawQuote.quoteNumber}
          confirmText="Withdraw Quotation"
          isDestructive={true}
          isLoading={withdrawingQuoteId === confirmWithdrawQuote.id}
        />
      )}

      {/* Reusable Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        referenceNumber={feedback.referenceNumber}
        referenceLabel="Quote Reference"
      />
    </div>
  );
}