"use client";

import { useState, type FormEvent } from "react";
import FeedbackModal from "@/components/ui/FeedbackModal";

type ProfileFormProps = {
  name: string;
  email: string;
  phone: string;
};

export default function ProfileForm({
  name: initialName,
  email,
  phone: initialPhone,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to update your profile.");
        return;
      }

      setName(data.user.name);
      setPhone(data.user.phone ?? "");
      setMessage(data.message || "Your profile has been updated.");
      setShowFeedbackModal(true);
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            readOnly
            aria-describedby="email-help"
            className="min-h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
          />
          <p id="email-help" className="mt-2 text-xs text-slate-500">
            Email changes will be available after we add email verification.
          </p>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="e.g. +233 24 123 4567"
            className="min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-2 text-xs text-slate-500">
            Include your country code if you are using an international number.
          </p>
        </div>

        {message && (
          <p
            role="status"
            className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving || name.trim().length < 2}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSaving ? "Saving changes..." : "Save changes"}
        </button>
      </form>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        variant="success"
        title="Profile Updated"
        message="Your account information has been saved successfully."
      />
    </>
  );
}
