"use client";

import { useMemo, useState } from "react";
import {
  MailCheck,
  CheckCircle,
  Archive,
  Trash2,
  Phone,
  Clock,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";

export type ContactMessageRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "NEW" | "READ" | "RESOLVED" | "ARCHIVED";
  createdAt: string;
};

type FilterStatus = "ALL" | "NEW" | "READ" | "RESOLVED" | "ARCHIVED";

export default function ContactMessageManager({
  initialMessages,
}: {
  initialMessages: ContactMessageRecord[];
}) {
  const [messages, setMessages] = useState<ContactMessageRecord[]>(initialMessages);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageRecord | null>(null);

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

  const visibleMessages = useMemo(
    () =>
      messages.filter((msg) => filter === "ALL" || msg.status === filter),
    [messages, filter]
  );

  const counts = useMemo(
    () => ({
      ALL: messages.length,
      NEW: messages.filter((m) => m.status === "NEW").length,
      READ: messages.filter((m) => m.status === "READ").length,
      RESOLVED: messages.filter((m) => m.status === "RESOLVED").length,
      ARCHIVED: messages.filter((m) => m.status === "ARCHIVED").length,
    }),
    [messages]
  );

  async function updateStatus(
    id: string,
    status: "READ" | "RESOLVED" | "ARCHIVED"
  ) {
    setBusyId(id);

    try {
      const response = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Status Update Failed",
          message: typeof data?.message === "string" ? data.message : "Unable to update message.",
        });
        return;
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, status } : msg))
      );

      const title =
        status === "READ"
          ? "Message Marked as Read"
          : status === "RESOLVED"
            ? "Message Resolved"
            : "Message Archived";

      setFeedback({
        isOpen: true,
        variant: "success",
        title,
        message: typeof data?.message === "string" ? data.message : `Message marked as ${status.toLowerCase()}.`,
      });
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to connect to the server.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setBusyId(id);

    try {
      const response = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteTarget(null);
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Delete Failed",
          message: typeof data?.message === "string" ? data.message : "Unable to delete message.",
        });
        return;
      }

      setMessages((prev) => prev.filter((m) => m.id !== id));
      setDeleteTarget(null);

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Message Deleted",
        message: "The contact message has been permanently deleted.",
      });
    } catch {
      setDeleteTarget(null);
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to connect to the server.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "NEW", "READ", "RESOLVED", "ARCHIVED"] as FilterStatus[]).map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                filter === status
                  ? "bg-[#031c43] text-white shadow"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {status === "ALL" ? "All Messages" : status} ({counts[status]})
            </button>
          )
        )}
      </div>

      {/* Messages List */}
      {visibleMessages.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          No contact messages found in this category.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleMessages.map((msg) => {
            const isBusy = busyId === msg.id;

            return (
              <article
                key={msg.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-lg">
                        {msg.subject}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          msg.status === "NEW"
                            ? "bg-blue-100 text-blue-800"
                            : msg.status === "READ"
                              ? "bg-slate-100 text-slate-700"
                              : msg.status === "RESOLVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{msg.name}</span>
                      <span>·</span>
                      <span>{msg.email}</span>
                      {msg.phone && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Phone size={12} />
                            {msg.phone}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(msg.createdAt).toLocaleString("en-GH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 border border-slate-100">
                      {msg.message}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:self-start">
                    {msg.status === "NEW" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => updateStatus(msg.id, "READ")}
                        className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition"
                      >
                        <MailCheck size={13} />
                        Mark Read
                      </button>
                    )}

                    {msg.status !== "RESOLVED" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => updateStatus(msg.id, "RESOLVED")}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                      >
                        <CheckCircle size={13} />
                        Resolve
                      </button>
                    )}

                    {msg.status !== "ARCHIVED" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => updateStatus(msg.id, "ARCHIVED")}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Archive size={13} />
                        Archive
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setDeleteTarget(msg)}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Delete Message */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={executeDelete}
          title="Delete this message?"
          description={`Permanently delete the contact inquiry "${deleteTarget.subject}" from ${deleteTarget.name}?`}
          consequences="This message will be permanently removed from the database."
          confirmText="Delete Message"
          isDestructive={true}
          isLoading={busyId === deleteTarget.id}
        />
      )}

      {/* Feedback Modal */}
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

