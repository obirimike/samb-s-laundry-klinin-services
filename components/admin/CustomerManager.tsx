"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  PauseCircle,
  PlayCircle,
  Trash2,
  Edit2,
  Save,
  X,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";

export type CustomerData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  accountStatus: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  bookingCount: number;
};

export default function CustomerManager({
  customer,
}: {
  customer: CustomerData;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone || "");

  // Confirmation modal states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Feedback modal state
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
    redirectTo?: string;
  }>({
    isOpen: false,
    variant: "success",
    title: "",
    message: "",
  });

  async function handleSaveDetails(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Update Failed",
          message: data.message || "Unable to save customer details.",
        });
        return;
      }

      setIsEditing(false);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Profile Updated",
        message: data.message || "Customer information has been saved successfully.",
      });

      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to connect to the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function executeSuspend() {
    setShowSuspendModal(false);
    setBusy(true);

    try {
      const response = await fetch(
        `/api/admin/customers/${customer.id}/suspend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Administrative suspension" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Suspension Failed",
          message: data.message || "Unable to suspend this customer account.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Customer Account Suspended",
        message:
          data.message ||
          "This customer's access to SAMB has been suspended. They will no longer be able to log in or submit bookings.",
      });

      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to connect to the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function executeReactivate() {
    setShowReactivateModal(false);
    setBusy(true);

    try {
      const response = await fetch(
        `/api/admin/customers/${customer.id}/reactivate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Administrative reactivation" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Reactivation Failed",
          message: data.message || "Unable to reactivate this account.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Customer Account Reactivated",
        message:
          data.message ||
          "This customer can now sign in and book services again.",
      });

      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to connect to the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function executeDelete() {
    setShowDeleteModal(false);
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: customer.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Deletion Prevented",
          message:
            data.message ||
            "This customer account has historical bookings and cannot be deleted. Suspend the account instead.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Customer Account Deleted",
        message: `The account for ${customer.name} has been permanently deleted.`,
        redirectTo: "/admin/customers",
      });
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to connect to the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Customer Header Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <UserRound size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {customer.name}
                </h1>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                    customer.accountStatus === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {customer.accountStatus}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Customer account since{" "}
                {new Date(customer.createdAt).toLocaleDateString("en-GH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              {isEditing ? <X size={15} /> : <Edit2 size={15} />}
              <span>{isEditing ? "Cancel" : "Edit details"}</span>
            </button>

            {customer.accountStatus === "ACTIVE" ? (
              <button
                type="button"
                onClick={() => setShowSuspendModal(true)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition"
              >
                <PauseCircle size={15} />
                <span>Suspend account</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowReactivateModal(true)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition"
              >
                <PlayCircle size={15} />
                <span>Reactivate account</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition"
            >
              <Trash2 size={15} />
              <span>Delete account</span>
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <form
            onSubmit={handleSaveDetails}
            className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-5"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900">
              Edit customer information
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0241234567"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition shadow-sm"
              >
                <Save size={14} />
                <span>Save changes</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </p>
              <p className="mt-1.5 break-all font-semibold text-slate-900">
                {customer.email}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Phone Number
              </p>
              <p className="mt-1.5 font-semibold text-slate-900">
                {customer.phone || "Not provided"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Account Status
              </p>
              <p className="mt-1.5 font-semibold text-slate-900">
                {customer.accountStatus}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Bookings
              </p>
              <p className="mt-1.5 font-semibold text-slate-900">
                {customer.bookingCount}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Confirmation Modal: Suspend */}
      <ConfirmModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={executeSuspend}
        title="Suspend this customer?"
        description="The customer will no longer be able to sign in, create new bookings, or access protected customer functionality."
        consequences="All historical booking records, quotes, reviews, and operational records will be preserved."
        recordName={`${customer.name} (${customer.email})`}
        confirmText="Suspend Customer"
        isDestructive={true}
        isLoading={busy}
      />

      {/* Confirmation Modal: Reactivate */}
      <ConfirmModal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        onConfirm={executeReactivate}
        title="Reactivate this customer?"
        description="This customer will be permitted to sign in and request new laundry and cleaning services again."
        recordName={`${customer.name} (${customer.email})`}
        confirmText="Reactivate Customer"
        isLoading={busy}
      />

      {/* Confirmation Modal: Delete */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDelete}
        title="Permanently delete this customer account?"
        description="Permanent deletion is only permitted for accounts that have no historical bookings, quotes, or business records."
        consequences="If this customer has historical bookings or quotes, deletion will be blocked and suspension should be used instead to preserve audit and operational records."
        recordName={`${customer.name} (${customer.email})`}
        confirmText="Permanently Delete"
        isDestructive={true}
        requireConfirmationText={customer.email}
        confirmationPlaceholder={customer.email}
        isLoading={busy}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => {
          setFeedback((prev) => ({ ...prev, isOpen: false }));
          if (feedback.redirectTo) {
            router.push(feedback.redirectTo);
          }
        }}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        primaryAction={{
          label: feedback.redirectTo ? "Go to Customers" : "OK",
          onClick: () => {
            setFeedback((prev) => ({ ...prev, isOpen: false }));
            if (feedback.redirectTo) {
              router.push(feedback.redirectTo);
            }
          },
        }}
      />
    </div>
  );
}

