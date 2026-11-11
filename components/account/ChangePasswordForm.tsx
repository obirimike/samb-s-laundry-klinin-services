"use client";

import { useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Your new passwords do not match.");
      return;
    }

    if (newPassword.length < 12) {
      setError("Your new password must contain at least 12 characters.");
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("Your new password must not exceed 72 UTF-8 bytes.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to change your password.");
        return;
      }

      // The password update increments sessionVersion.
      // Sign out locally and require a fresh login.
      await signOut({
        redirect: true,
        callbackUrl: "/login?passwordChanged=true",
      });
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <label
          htmlFor="currentPassword"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={72}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-2 text-xs text-slate-500">
          Use at least 12 characters. The maximum is 72 UTF-8 bytes.
        </p>
        <PasswordStrengthIndicator password={newPassword} />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>

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
        disabled={
          isSaving ||
          !currentPassword ||
          newPassword.length < 12 ||
          !confirmPassword
        }
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isSaving ? "Changing password..." : "Change password"}
      </button>
    </form>
  );
}