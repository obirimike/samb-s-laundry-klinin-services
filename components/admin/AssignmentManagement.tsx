"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";

type StaffOption = {
  id: string;
  name: string;
  email: string;
};

type Assignment = {
  id: string;
  staffId: string;
  staff: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  notes: string | null;
  isActive: boolean;
  assignedAt: string;
  unassignedAt: string | null;
  assignedByName: string;
  unassignedByName: string | null;
};

type BookingRecord = {
  id: string;
  bookingNumber: string;
  status: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  specialInstructions: string | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
  service: {
    name: string;
    category: string;
  };
  assignments: Assignment[];
};

type Props = {
  initialBookings: BookingRecord[];
  staff: StaffOption[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  });
}

export default function AssignmentManagement({
  initialBookings,
  staff,
}: Props) {
  const router = useRouter();

  const [selectedStaff, setSelectedStaff] = useState<Record<string, string>>(
    {}
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [unassignTarget, setUnassignTarget] = useState<{
    booking: BookingRecord;
    assignment: Assignment;
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

  async function assignStaff(
    event: FormEvent<HTMLFormElement>,
    booking: BookingRecord
  ) {
    event.preventDefault();

    const staffId = selectedStaff[booking.id];

    if (!staffId) {
      setError("Select a staff member first.");
      return;
    }

    const assignmentNotes = (notes[booking.id] ?? "").trim();

    if (assignmentNotes.length > 2000) {
      setError("Assignment notes must be 2,000 characters or fewer.");
      return;
    }

    setBusyKey(booking.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/bookings/${booking.id}/assignments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId,
            ...(assignmentNotes ? { notes: assignmentNotes } : {}),
          }),
        }
      );

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Assignment Failed",
          message: result.message || "Unable to assign staff.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Staff Assigned Successfully",
        message:
          result.message ||
          `Staff member assigned to booking ${booking.bookingNumber}.`,
        referenceNumber: booking.bookingNumber,
      });

      setSelectedStaff((current) => ({
        ...current,
        [booking.id]: "",
      }));
      setNotes((current) => ({
        ...current,
        [booking.id]: "",
      }));

      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function executeUnassign() {
    if (!unassignTarget) return;
    const { booking, assignment } = unassignTarget;
    setUnassignTarget(null);

    setBusyKey(assignment.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/bookings/${booking.id}/assignments/${assignment.id}`,
        { method: "DELETE" }
      );

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Unassign Failed",
          message: result.message || "Unable to unassign staff.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Staff Unassigned",
        message:
          result.message ||
          `${assignment.staff.name} has been unassigned from ${booking.bookingNumber}.`,
        referenceNumber: booking.bookingNumber,
      });

      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  function unassignStaff(booking: BookingRecord, assignment: Assignment) {
    setUnassignTarget({ booking, assignment });
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
          Admin workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Staff assignments
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Assign team members to confirmed work, keep assignment notes, and
          review who was responsible for each booking.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {staff.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No staff accounts exist yet. Create staff accounts on the Admin Staff
          Management page before assigning bookings.
        </div>
      )}

      {initialBookings.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="text-lg font-bold text-slate-900">
            No eligible bookings
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Only confirmed or in-progress bookings are available for assignment.
          </p>
        </section>
      ) : (
        <div className="space-y-5">
          {initialBookings.map((booking) => {
            const activeAssignments = booking.assignments.filter(
              (assignment) => assignment.isActive
            );
            const history = booking.assignments.filter(
              (assignment) => !assignment.isActive
            );

            return (
              <section
                key={booking.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {booking.bookingNumber}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.service.name} · {booking.service.category.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(booking.preferredDate)} at {booking.preferredTime}
                    </p>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    {booking.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800">
                      Customer and service details
                    </h3>
                    <p className="text-sm text-slate-700">
                      {booking.customer.name}
                    </p>
                    <p className="break-all text-sm text-slate-500">
                      {booking.customer.email}
                    </p>
                    {booking.customer.phone && (
                      <p className="text-sm text-slate-500">
                        {booking.customer.phone}
                      </p>
                    )}
                    <p className="pt-1 text-sm text-slate-600">
                      <span className="font-medium">Address:</span>{" "}
                      {booking.address}
                    </p>
                    {booking.specialInstructions && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Instructions:</span>{" "}
                        {booking.specialInstructions}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-800">
                      Assign another staff member
                    </h3>

                    <form
                      onSubmit={(event) => assignStaff(event, booking)}
                      className="space-y-3"
                    >
                      <select
                        required
                        value={selectedStaff[booking.id] ?? ""}
                        onChange={(event) =>
                          setSelectedStaff((current) => ({
                            ...current,
                            [booking.id]: event.target.value,
                          }))
                        }
                        disabled={staff.length === 0 || busyKey !== null}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                      >
                        <option value="">Select staff member</option>
                        {staff.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} — {member.email}
                          </option>
                        ))}
                      </select>

                      <textarea
                        rows={2}
                        maxLength={2000}
                        value={notes[booking.id] ?? ""}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [booking.id]: event.target.value,
                          }))
                        }
                        placeholder="Assignment notes (optional)"
                        className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />

                      <button
                        type="submit"
                        disabled={staff.length === 0 || busyKey !== null}
                        className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyKey === booking.id
                          ? "Assigning..."
                          : "Assign staff"}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="border-t border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-slate-900">
                      Active staff
                    </h3>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      {activeAssignments.length} assigned
                    </span>
                  </div>

                  {activeAssignments.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No staff currently assigned.
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {activeAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {assignment.staff.name}
                            </p>
                            <p className="mt-1 break-all text-sm text-slate-500">
                              {assignment.staff.email}
                            </p>
                            {assignment.notes && (
                              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                                {assignment.notes}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-slate-500">
                              Assigned {formatDateTime(assignment.assignedAt)}
                              {" · "}By {assignment.assignedByName}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={busyKey !== null}
                            onClick={() => unassignStaff(booking, assignment)}
                            className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {busyKey === assignment.id
                              ? "Unassigning..."
                              : "Unassign"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {history.length > 0 && (
                  <details className="border-t border-slate-200 p-5">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                      Assignment history ({history.length})
                    </summary>

                    <div className="mt-4 space-y-3">
                      {history.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="rounded-xl bg-slate-50 p-4 text-sm"
                        >
                          <p className="font-semibold text-slate-800">
                            {assignment.staff.name}
                          </p>
                          <p className="mt-1 text-slate-500">
                            Assigned {formatDateTime(assignment.assignedAt)}
                            {" · "}By {assignment.assignedByName}
                          </p>
                          <p className="mt-1 text-slate-500">
                            Unassigned{" "}
                            {assignment.unassignedAt
                              ? formatDateTime(assignment.unassignedAt)
                              : "—"}
                            {assignment.unassignedByName
                              ? ` · By ${assignment.unassignedByName}`
                              : ""}
                          </p>
                          {assignment.notes && (
                            <p className="mt-2 whitespace-pre-wrap text-slate-600">
                              {assignment.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Unassign */}
      {unassignTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setUnassignTarget(null)}
          onConfirm={executeUnassign}
          title="Unassign staff member?"
          description={`Unassign ${unassignTarget.assignment.staff.name} from booking ${unassignTarget.booking.bookingNumber}?`}
          consequences="The staff member will be notified that this booking has been unassigned from their dashboard."
          recordName={unassignTarget.booking.bookingNumber}
          confirmText="Unassign Staff"
          isDestructive={true}
          isLoading={busyKey === unassignTarget.assignment.id}
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
        referenceLabel="Booking Reference"
      />
    </div>
  );
}
