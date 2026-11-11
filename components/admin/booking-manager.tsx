"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Save, Trash2, } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";

type BookingManagerProps = {
  bookingId: string;
  bookingNumber?: string;
  currentStatus: string;
  initialNotes: string;
};

const transitions: Record<string, { value: string; label: string }[]> = {
  PENDING: [
    { value: "CONFIRMED", label: "Confirm booking" },
    { value: "CANCELLED", label: "Cancel booking" },
  ],
  CONFIRMED: [
    { value: "IN_PROGRESS", label: "Mark service in progress" },
    { value: "CANCELLED", label: "Cancel booking" },
  ],
  IN_PROGRESS: [
    { value: "COMPLETED", label: "Mark service completed" },
    { value: "CANCELLED", label: "Cancel booking" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export default function BookingManager({
  bookingId,
  bookingNumber = "",
  currentStatus,
  initialNotes,
}: BookingManagerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [adminNotes, setAdminNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals state
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
    referenceNumber?: string;
    redirectTo?: string;
  }>({
    isOpen: false,
    variant: "success",
    title: "",
    message: "",
  });

  const options = transitions[currentStatus] || [];

  function handleSaveClick() {
    if (status !== currentStatus) {
      setShowStatusConfirmModal(true);
    } else {
      executeSave();
    }
  }

  async function executeSave() {
    setShowStatusConfirmModal(false);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(status !== currentStatus ? { status } : {}),
          adminNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Update Failed",
          message: data.message || "Unable to update this booking.",
        });
        return;
      }

      const successTitle =
        status === "CONFIRMED"
          ? "Booking Confirmed"
          : status === "CANCELLED"
            ? "Booking Cancelled"
            : status === "IN_PROGRESS"
              ? "Service Marked In Progress"
              : status === "COMPLETED"
                ? "Service Completed"
                : "Booking Updated";

      setFeedback({
        isOpen: true,
        variant: "success",
        title: successTitle,
        message: data.message || "Booking has been updated successfully.",
        referenceNumber: bookingNumber || undefined,
      });

      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "We couldn't reach the server. Please check your internet connection and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function executeDelete() {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: bookingNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setShowDeleteConfirmModal(false);
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Deletion Prevented",
          message: data.message || "Unable to delete this booking.",
        });
        return;
      }

      setShowDeleteConfirmModal(false);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Booking Deleted",
        message: `Booking ${bookingNumber} has been permanently deleted from the system.`,
        redirectTo: "/admin/bookings",
      });
    } catch {
      setShowDeleteConfirmModal(false);
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "We couldn't reach the server. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold text-slate-900">
        Manage booking
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Update the request as your team reviews it and delivers the service.
        Customers can see the booking status, but administrator notes remain
        private.
      </p>

      {options.length > 0 ? (
        <div className="mt-5">
          <label
            htmlFor="bookingStatus"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Change status
          </label>
          <select
            id="bookingStatus"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value={currentStatus}>
              Keep current status ({currentStatus.replaceAll("_", " ")})
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          This booking is {currentStatus.toLowerCase()} and cannot transition
          to another status in the current workflow.
        </p>
      )}

      <div className="mt-5">
        <label
          htmlFor="adminNotes"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Private administrator notes
        </label>
        <textarea
          id="adminNotes"
          rows={5}
          maxLength={3000}
          value={adminNotes}
          onChange={(event) => setAdminNotes(event.target.value)}
          placeholder="Record internal follow-up, agreed scope, or other operational details."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
        <p className="mt-1 text-right text-xs text-slate-500">
          {adminNotes.length}/3000 characters
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSaveClick}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 transition"
        >
          {isSaving ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? "Saving changes..." : "Save changes"}
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteConfirmModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 transition"
        >
          <Trash2 size={16} />
          <span>Delete booking</span>
        </button>
      </div>

      {/* Confirmation Modal for Status Change */}
      <ConfirmModal
        isOpen={showStatusConfirmModal}
        onClose={() => setShowStatusConfirmModal(false)}
        onConfirm={executeSave}
        title={
          status === "CONFIRMED"
            ? "Confirm this booking?"
            : status === "CANCELLED"
              ? "Cancel this booking?"
              : "Update booking status?"
        }
        description={
          status === "CONFIRMED"
            ? `Are you sure you want to confirm booking ${bookingNumber}? The customer will receive an in-app notification and email update.`
            : status === "CANCELLED"
              ? `Are you sure you want to cancel booking ${bookingNumber}? The customer will be informed that the service has been cancelled.`
              : `Change status from ${currentStatus.replaceAll("_", " ")} to ${status.replaceAll("_", " ")}?`
        }
        recordName={bookingNumber}
        confirmText={
          status === "CONFIRMED"
            ? "Confirm Booking"
            : status === "CANCELLED"
              ? "Cancel Booking"
              : "Update Status"
        }
        isDestructive={status === "CANCELLED"}
        isLoading={isSaving}
      />

      {/* Confirmation Modal for Permanent Booking Deletion */}
      <ConfirmModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={executeDelete}
        title="Delete this booking?"
        description="Consider cancelling or archiving this booking instead to preserve business history. Permanently deleting it will remove this record and associated operational entries."
        consequences="This action cannot be undone. All assignment and quote records linked to this booking will be removed."
        recordName={bookingNumber}
        confirmText="Permanently Delete Booking"
        isDestructive={true}
        requireConfirmationText={bookingNumber}
        confirmationPlaceholder={bookingNumber}
        isLoading={isDeleting}
      />

      {/* Reusable Feedback Modal */}
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
        referenceNumber={feedback.referenceNumber}
        referenceLabel="Booking Reference"
        primaryAction={{
          label: feedback.redirectTo ? "Go to Bookings" : "OK",
          onClick: () => {
            setFeedback((prev) => ({ ...prev, isOpen: false }));
            if (feedback.redirectTo) {
              router.push(feedback.redirectTo);
            }
          },
        }}
      />
    </section>
  );
}
