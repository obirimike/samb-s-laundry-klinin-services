
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Send, Sparkles, WashingMachine, Home, Bug } from "lucide-react";
import { ServiceCategory } from "@/types/service";
import FeedbackModal from "@/components/ui/FeedbackModal";

type ServiceOption = {
  id: string;
  name: string;
  category: ServiceCategory;
  slug?: string;
  description?: string;
};

function formatServiceCategory(category: ServiceCategory) {
  switch (category) {
    case "LAUNDRY":
      return "Laundry";
    case "DOMESTIC_SUPPORT":
      return "Domestic Support";
    case "PEST_CONTROL":
      return "Pest Control";
    case "CLEANING":
    default:
      return "Cleaning";
  }
}

function getServiceCategoryPreview(category: ServiceCategory) {
  switch (category) {
    case "LAUNDRY":
      return {
        icon: <WashingMachine size={18} />,
        containerClass: "bg-sky-100 text-sky-700",
        label: "Professional Laundry Care",
      };
    case "DOMESTIC_SUPPORT":
      return {
        icon: <Home size={18} />,
        containerClass: "bg-emerald-100 text-emerald-700",
        label: "Domestic Help & Household Support",
      };
    case "PEST_CONTROL":
      return {
        icon: <Bug size={18} />,
        containerClass: "bg-amber-100 text-amber-700",
        label: "Fumigation & Pest Control",
      };
    case "CLEANING":
    default:
      return {
        icon: <Sparkles size={18} />,
        containerClass: "bg-blue-100 text-blue-700",
        label: "Comprehensive Cleaning",
      };
  }
}

type BookingFormProps = {
  services: ServiceOption[];
  initialServiceId?: string;
};

export default function BookingForm({
  services,
  initialServiceId = "",
}: BookingFormProps) {
  const router = useRouter();

  const [serviceId, setServiceId] = useState(initialServiceId);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [numberOfRooms, setNumberOfRooms] = useState("");
  const [estimatedSize, setEstimatedSize] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bookingNumber, setBookingNumber] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentService = services.find((s) => s.id === serviceId);

  const today = new Date();
  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!serviceId) {
      setError("Please choose a service.");
      return;
    }

    if (preferredDate < minimumDate) {
      setError("Please choose today or a future date.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          preferredDate,
          preferredTime,
          address,
          propertyType: propertyType || undefined,
          numberOfRooms: numberOfRooms
            ? Number(numberOfRooms)
            : undefined,
          estimatedSize: estimatedSize || undefined,
          specialInstructions: specialInstructions || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to submit your request.");
        return;
      }

      setSuccess(data.message || "Your request has been submitted.");
      setBookingNumber(data.booking.bookingNumber);
      setShowSuccessModal(true);

      setPreferredDate("");
      setPreferredTime("");
      setAddress("");
      setPropertyType("");
      setNumberOfRooms("");
      setEstimatedSize("");
      setSpecialInstructions("");

      router.refresh();
    } catch {
      setError("A connection error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        There are currently no available services to book. Please check back
        later or contact our team.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <p className="font-semibold">{success}</p>
          {bookingNumber && (
            <p className="mt-1">
              Your booking reference is{" "}
              <span className="font-bold">{bookingNumber}</span>.
            </p>
          )}
          <p className="mt-2">
            Your request is pending review. Our team will discuss the scope,
            availability, and price before confirming it.
          </p>
          <button
            type="button"
            onClick={() => router.push("/account/bookings")}
            className="mt-3 font-semibold underline"
          >
            View my bookings
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section>
        <h2 className="text-lg font-bold text-slate-900">
          1. Choose your service
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select the service you would like to request.
        </p>

        <label
          htmlFor="serviceId"
          className="mb-2 mt-4 block text-sm font-medium text-slate-700"
        >
          Service
        </label>
        <select
          id="serviceId"
          required
          value={serviceId}
          onChange={(event) => setServiceId(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">Choose a service</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} — {formatServiceCategory(service.category)}
            </option>
          ))}
        </select>

        {currentService && (() => {
          const preview = getServiceCategoryPreview(currentService.category);
          return (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${preview.containerClass}`}
                >
                  {preview.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {currentService.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {preview.label}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-blue-200/60 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-xs">
                Selected
              </span>
            </div>
          );
        })()}
      </section>

      <section className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-bold text-slate-900">
          2. Preferred schedule
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          These are your preferences, not a confirmed appointment.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="preferredDate"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Preferred date
            </label>
            <input
              id="preferredDate"
              type="date"
              required
              min={minimumDate}
              value={preferredDate}
              onChange={(event) => setPreferredDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="preferredTime"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Preferred time
            </label>
            <input
              id="preferredTime"
              type="time"
              required
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-bold text-slate-900">
          3. Service location and details
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Service address
            </label>
            <textarea
              id="address"
              required
              minLength={5}
              maxLength={500}
              rows={3}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Enter the full address where the service is needed"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="propertyType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Property or venue type
              </label>
              <select
                id="propertyType"
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select if applicable</option>
                <option value="Residential">Residential</option>
                <option value="Office">Office</option>
                <option value="Commercial">Commercial property</option>
                <option value="Event venue">Event venue</option>
                <option value="Post-construction">Post-construction</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="numberOfRooms"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Number of rooms (optional)
              </label>
              <input
                id="numberOfRooms"
                type="number"
                min={1}
                max={500}
                value={numberOfRooms}
                onChange={(event) => setNumberOfRooms(event.target.value)}
                placeholder="e.g. 4"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="estimatedSize"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Approximate size (optional)
            </label>
            <input
              id="estimatedSize"
              maxLength={100}
              value={estimatedSize}
              onChange={(event) => setEstimatedSize(event.target.value)}
              placeholder="e.g. 2-bedroom apartment or medium office"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="specialInstructions"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Special instructions (optional)
            </label>
            <textarea
              id="specialInstructions"
              rows={4}
              maxLength={2000}
              value={specialInstructions}
              onChange={(event) => setSpecialInstructions(event.target.value)}
              placeholder="Describe any special requirements or areas that need attention"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        <strong>Pricing and confirmation:</strong> Prices are negotiable and
        depend on the scope of work. Submitting this form sends a request; it
        does not confirm the appointment or establish a final price.
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#031c43] px-5 py-3.5 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle className="animate-spin" size={19} />
        ) : (
          <Send size={18} />
        )}
        {isSubmitting ? "Submitting request..." : "Submit booking request"}
      </button>
      <FeedbackModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        variant="success"
        title="Booking Request Submitted"
        message="Your request has been received. Our team will review the details and reach out shortly to discuss the scope, schedule and confirm your appointment."
        referenceNumber={bookingNumber}
        referenceLabel="Booking Reference"
        primaryAction={{
          label: "View My Bookings",
          onClick: () => router.push("/account/bookings"),
        }}
        secondaryAction={{
          label: "Book Another Service",
          onClick: () => setShowSuccessModal(false),
        }}
      />
    </form>
  );
}
