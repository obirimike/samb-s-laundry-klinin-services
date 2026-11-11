"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Power,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { ServiceCategory } from "@/types/service";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";

type ServiceStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

type ServiceItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ServiceCategory;
  imageUrl: string | null;
  status: ServiceStatus;
  _count?: {
    bookings: number;
    reviews: number;
  };
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  category: "CLEANING" as ServiceCategory,
  imageUrl: "",
};

export default function ServiceManager({
  services,
}: {
  services: ServiceItem[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Confirmation modal states
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    service: ServiceItem;
    newStatus: ServiceStatus;
  } | null>(null);

  // Feedback modal state
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

  function startEditing(service: ServiceItem) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      slug: service.slug,
      description: service.description,
      category: service.category,
      imageUrl: service.imageUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function saveService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      const response = await fetch(
        editingId
          ? `/api/admin/services/${editingId}`
          : "/api/admin/services",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            slug: makeSlug(form.slug),
            imageUrl: form.imageUrl.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Unable to Save Service",
          message: data.message || "Failed to save service details.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: editingId ? "Service Updated" : "Service Added Successfully",
        message:
          data.message ||
          (editingId
            ? "Service details have been saved."
            : "The new laundry or cleaning service is now available."),
      });

      setEditingId(null);
      setForm(emptyForm);
      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "We couldn't reach the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function executeStatusChange() {
    if (!statusTarget) return;
    const { service, newStatus } = statusTarget;
    setStatusTarget(null);
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Status Change Failed",
          message: data.message || "Unable to update service status.",
        });
        return;
      }

      const title =
        newStatus === "ACTIVE"
          ? "Service Activated"
          : newStatus === "SUSPENDED"
            ? "Service Suspended"
            : "Service Deactivated";

      setFeedback({
        isOpen: true,
        variant: "success",
        title,
        message:
          data.message ||
          `${service.name} is now ${newStatus.toLowerCase()}.`,
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
    if (!deleteTarget) return;
    const service = deleteTarget;
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: service.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteTarget(null);
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Cannot Delete Service",
          message: data.message || "This service cannot be removed.",
        });
        return;
      }

      setDeleteTarget(null);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Service Deleted",
        message: `Service "${service.name}" was permanently removed.`,
      });

      router.refresh();
    } catch {
      setDeleteTarget(null);
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "Failed to connect to the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <form
        onSubmit={saveService}
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm"
      >
        <h2 className="text-xl font-bold text-slate-900">
          {editingId ? "Edit service" : "Add a service"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Use a descriptive name and URL-friendly slug. Prices remain negotiable
          and can be discussed with customers.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Service name
            <input
              required
              minLength={2}
              maxLength={100}
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                setForm((previous) => ({
                  ...previous,
                  name,
                  ...(editingId ? {} : { slug: makeSlug(name) }),
                }));
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="e.g. Office Cleaning"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            URL slug
            <input
              required
              value={form.slug}
              onChange={(event) =>
                updateField("slug", makeSlug(event.target.value))
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="office-cleaning"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Category
            <select
              value={form.category}
              onChange={(event) =>
                updateField("category", event.target.value as ServiceCategory)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="CLEANING">Cleaning</option>
              <option value="LAUNDRY">Laundry</option>
              <option value="DOMESTIC_SUPPORT">Domestic Support</option>
              <option value="PEST_CONTROL">Pest Control</option>
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Image URL (optional)
            <input
              type="url"
              value={form.imageUrl}
              onChange={(event) => updateField("imageUrl", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="https://..."
            />
          </label>

          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Description
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Describe what this service includes..."
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition shadow-sm"
          >
            {busy ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : editingId ? (
              <Save size={18} />
            ) : (
              <Plus size={18} />
            )}
            {busy ? "Saving..." : editingId ? "Save changes" : "Add service"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel editing
            </button>
          )}
        </div>
      </form>

      {/* Services List */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Existing services
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage service statuses. Inactive or suspended services do not appear
            in public bookings, while historical bookings retain their service details.
          </p>
        </div>

        {services.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            No services found.
          </div>
        ) : (
          services.map((service) => {
            const hasHistory =
              (service._count?.bookings ?? 0) > 0 ||
              (service._count?.reviews ?? 0) > 0;

            return (
              <article
                key={service.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-bold text-slate-900">
                        {service.name}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                          service.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : service.status === "SUSPENDED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {service.status}
                      </span>
                      {hasHistory && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                          {service._count?.bookings} booking(s)
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                      {service.category.replaceAll("_", " ")}
                    </p>

                    <p className="mt-2.5 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {service.description}
                    </p>

                    <p className="mt-2 break-all text-xs font-mono text-slate-400">
                      /services/{service.slug}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startEditing(service)}
                      className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
                    >
                      Edit
                    </button>

                    {/* Status actions */}
                    {service.status !== "ACTIVE" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setStatusTarget({ service, newStatus: "ACTIVE" })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 transition"
                      >
                        <PlayCircle size={14} />
                        Activate
                      </button>
                    )}

                    {service.status === "ACTIVE" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setStatusTarget({ service, newStatus: "SUSPENDED" })
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60 transition"
                        >
                          <PauseCircle size={14} />
                          Suspend
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setStatusTarget({ service, newStatus: "INACTIVE" })
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60 transition"
                        >
                          <Power size={14} />
                          Deactivate
                        </button>
                      </>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDeleteTarget(service)}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60 transition"
                      title={
                        hasHistory
                          ? "This service has bookings; permanent deletion is prevented."
                          : "Permanently delete service"
                      }
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Confirmation Modal for Status Changes */}
      {statusTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setStatusTarget(null)}
          onConfirm={executeStatusChange}
          title={
            statusTarget.newStatus === "ACTIVE"
              ? "Activate this service?"
              : statusTarget.newStatus === "SUSPENDED"
                ? "Suspend this service temporarily?"
                : "Deactivate this service?"
          }
          description={
            statusTarget.newStatus === "ACTIVE"
              ? `Customers will be able to discover and book ${statusTarget.service.name} immediately.`
              : statusTarget.newStatus === "SUSPENDED"
                ? `${statusTarget.service.name} will be temporarily suspended and hidden from public booking options.`
                : `${statusTarget.service.name} will be marked as inactive and removed from public booking options.`
          }
          consequences={
            statusTarget.newStatus !== "ACTIVE"
              ? "Existing bookings will retain their service references, but new booking requests cannot be submitted."
              : undefined
          }
          recordName={statusTarget.service.name}
          confirmText={
            statusTarget.newStatus === "ACTIVE"
              ? "Activate Service"
              : statusTarget.newStatus === "SUSPENDED"
                ? "Suspend Service"
                : "Deactivate Service"
          }
          isLoading={busy}
        />
      )}

      {/* Confirmation Modal for Permanent Delete */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={executeDelete}
          title="Delete this service?"
          description="This action will permanently remove the service if no protected records depend on it."
          consequences="If this service has associated bookings or reviews, deletion will be blocked to preserve historical business records."
          recordName={deleteTarget.name}
          confirmText="Permanently Delete"
          isDestructive={true}
          requireConfirmationText={deleteTarget.name}
          confirmationPlaceholder={deleteTarget.name}
          isLoading={busy}
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
