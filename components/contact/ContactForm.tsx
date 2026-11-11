"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, LoaderCircle, Sparkles } from "lucide-react";
import FeedbackModal from "@/components/ui/FeedbackModal";

interface FormErrors {
  name?: string[];
  email?: string[];
  phone?: string[];
  subject?: string[];
  message?: string[];
}

const subjectOptions = [
  "General Enquiry",
  "Laundry & Fabric Care",
  "Residential & Office Cleaning",
  "Domestic Support Services",
  "Pest Control & Fumigation",
  "Custom Quote Request",
  "Other Assistance",
];

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(subjectOptions[0]);
  const [message, setMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setSubject(subjectOptions[0]);
    setMessage("");
    setErrors({});
    setGeneralError("");
    setIsSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          setErrors(data.errors);
          setGeneralError("Please fix the highlighted fields below.");
        } else {
          setGeneralError(
            data.message ||
              "Unable to submit your message right now. Please try again or reach out directly by phone."
          );
        }
        return;
      }

      setIsSubmitted(true);
      setShowFeedbackModal(true);
    } catch {
      setGeneralError(
        "A network error occurred. Please check your connection or reach us directly via call or email."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Sparkles size={14} /> Send a Direct Message
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            We&apos;d love to hear from you
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Fill out the form below and our customer service team will respond promptly.
          </p>
        </div>

        {isSubmitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-8 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-emerald-950 sm:text-2xl">
              Message Received!
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-emerald-800">
              Thank you, <span className="font-semibold">{name}</span>. Your message has been routed to our support desk. We will review your request and get back to you shortly.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                Send Another Message
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {generalError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
                <span>{generalError}</span>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ama Mensah"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={`mt-2 block w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.name
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1.5 text-xs text-rose-600">
                    {errors.name[0]}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ama.mensah@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`mt-2 block w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-xs text-rose-600">
                    {errors.email[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Phone / Mobile */}
              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Phone / WhatsApp <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 024 123 4567"
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                {errors.phone && (
                  <p className="mt-1.5 text-xs text-rose-600">{errors.phone[0]}</p>
                )}
              </div>

              {/* Service of Interest / Subject */}
              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Service of Interest <span className="text-rose-500">*</span>
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {subjectOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Your Message <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-400">
                  {message.length}/3000
                </span>
              </div>
              <textarea
                id="contact-message"
                required
                rows={5}
                maxLength={3000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about the property or items needing service, preferred schedule, location, or any specific questions..."
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
                className={`mt-2 block w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.message
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />
              {errors.message && (
                <p id="message-error" className="mt-1.5 text-xs text-rose-600">
                  {errors.message[0]}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#031c43] px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    <span>Sending message...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Submit Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Confirmation feedback modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        variant="success"
        title="Message Sent Successfully"
        message="Thank you for reaching out to SAMB's Services. We have received your inquiry and our team will get in touch with you shortly."
        primaryAction={{
          label: "Got it",
          onClick: () => setShowFeedbackModal(false),
        }}
      />
    </>
  );
}
