"use client";

import { useState, type FormEvent } from "react";
import {
  PauseCircle,
  PlayCircle,
  Trash2,
  Edit2,
  Plus,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  accountStatus: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  activeAssignmentCount: number;
};

type Props = {
  initialStaff: StaffMember[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StaffManagement({ initialStaff }: Props) {
  const [staff, setStaff] = useState(initialStaff);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Edit staff state
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Confirmation modal targets
  const [suspendTarget, setSuspendTarget] = useState<StaffMember | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  // Feedback modal
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

  async function refreshStaffList() {
    try {
      const refresh = await fetch("/api/admin/staff", { cache: "no-store" });
      if (refresh.ok) {
        const data = (await refresh.json()) as { staff: StaffMember[] };
        setStaff(data.staff);
      }
    } catch {
      // ignore
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Account Creation Failed",
          message: result.message || "Unable to create staff account.",
        });
        return;
      }

      await refreshStaffList();
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Staff Account Created",
        message: result.message || "New staff account has been created successfully.",
      });
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingStaff) return;
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Update Failed",
          message: result.message || "Unable to update staff details.",
        });
        return;
      }

      await refreshStaffList();
      setEditingStaff(null);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Staff Details Updated",
        message: result.message || "Staff member updated successfully.",
      });
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "Failed to connect to the server.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function executeSuspend() {
    if (!suspendTarget) return;
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/staff/${suspendTarget.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Administrative staff suspension" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Suspension Failed",
          message: data.message || "Unable to suspend this staff account.",
        });
        return;
      }

      await refreshStaffList();
      setSuspendTarget(null);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Staff Account Suspended",
        message: data.message || "This staff account has been suspended.",
      });
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to connect to the server.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function executeReactivate() {
    if (!reactivateTarget) return;
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/staff/${reactivateTarget.id}/reactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Administrative staff reactivation" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Reactivation Failed",
          message: data.message || "Unable to reactivate this staff account.",
        });
        return;
      }

      await refreshStaffList();
      setReactivateTarget(null);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Staff Account Reactivated",
        message: data.message || "This staff account has been reactivated.",
      });
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to connect to the server.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/staff/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: deleteTarget.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteTarget(null);
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Deletion Blocked",
          message:
            data.message ||
            "This staff member has historical assignments. Suspend the account instead.",
        });
        return;
      }

      await refreshStaffList();
      setDeleteTarget(null);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Staff Account Deleted",
        message: `Staff account for ${deleteTarget.name} has been permanently deleted.`,
      });
    } catch {
      setDeleteTarget(null);
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "Failed to connect to the server.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
          Admin workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Staff management
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create staff accounts, update details, manage statuses, and monitor
          active assignments.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        {/* Directory */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Staff directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {staff.length} staff account{staff.length === 1 ? "" : "s"}
            </p>
          </div>

          {staff.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-semibold text-slate-800">
                No staff accounts yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Create your first staff account using the form.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {member.name}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          member.accountStatus === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {member.accountStatus}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-sm text-slate-600">
                      {member.email}
                    </p>
                    {member.phone && (
                      <p className="mt-1 text-sm text-slate-500">
                        {member.phone}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-slate-400">
                      Created {formatDate(member.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <div className="rounded-xl bg-blue-50 px-3.5 py-2 text-center">
                      <p className="text-xl font-bold text-blue-800">
                        {member.activeAssignmentCount}
                      </p>
                      <p className="text-[10px] uppercase font-semibold text-blue-700">
                        Active
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditingStaff(member);
                        setEditName(member.name);
                        setEditPhone(member.phone || "");
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Edit2 size={14} />
                    </button>

                    {member.accountStatus === "ACTIVE" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setSuspendTarget(member)}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                        title="Suspend staff account"
                      >
                        <PauseCircle size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setReactivateTarget(member)}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                        title="Reactivate staff account"
                      >
                        <PlayCircle size={14} />
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDeleteTarget(member)}
                      className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                      title="Permanently delete staff account"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Create Form */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Create staff account
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              New team members can log in to view assignments.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 p-5">
            <div>
              <label
                htmlFor="staff-name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                id="staff-name"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="staff-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="staff-email"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="staff-phone"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Phone number (optional)
              </label>
              <input
                id="staff-phone"
                type="tel"
                maxLength={30}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="staff-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Initial password
              </label>
              <input
                id="staff-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-500">
                Use at least 10 characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 transition shadow-sm"
            >
              <Plus size={16} />
              <span>{busy ? "Creating account..." : "Create staff account"}</span>
            </button>
          </form>
        </section>
      </div>

      {/* Edit Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setEditingStaff(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">
              Edit Staff Member
            </h3>
            <p className="mt-1 text-xs text-slate-500">{editingStaff.email}</p>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 0241234567"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition shadow-sm"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Suspend */}
      {suspendTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setSuspendTarget(null)}
          onConfirm={executeSuspend}
          title="Suspend staff account?"
          description={`Suspend account for ${suspendTarget.name}? The team member will not be able to log in or access staff tools.`}
          consequences="All past assignments will remain linked to this account for audit purposes."
          recordName={`${suspendTarget.name} (${suspendTarget.email})`}
          confirmText="Suspend Account"
          isDestructive={true}
          isLoading={busy}
        />
      )}

      {/* Confirmation Modal: Reactivate */}
      {reactivateTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setReactivateTarget(null)}
          onConfirm={executeReactivate}
          title="Reactivate staff account?"
          description={`Reactivate ${reactivateTarget.name}'s account so they can sign in and be assigned to bookings again?`}
          recordName={`${reactivateTarget.name} (${reactivateTarget.email})`}
          confirmText="Reactivate Account"
          isLoading={busy}
        />
      )}

      {/* Confirmation Modal: Delete */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={executeDelete}
          title="Delete staff account?"
          description="Permanently delete this staff account if they have no assignment records."
          consequences="If this staff member has past assignments, deletion will be blocked and suspension should be used instead."
          recordName={`${deleteTarget.name} (${deleteTarget.email})`}
          confirmText="Permanently Delete"
          isDestructive={true}
          requireConfirmationText={deleteTarget.email}
          confirmationPlaceholder={deleteTarget.email}
          isLoading={busy}
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
