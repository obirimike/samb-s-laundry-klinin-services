"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

/** Returns true when the password satisfies all strength criteria. */
function isStrongPassword(pw: string): boolean {
  return (
    pw.length >= 8 &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError(
        "Your password must include upper and lower-case letters, a number, and a special character."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to create your account.");
        return;
      }

      // Sign in automatically after successful registration.
      const loginResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!loginResult?.ok || loginResult.error) {
        window.location.assign(
          new URL("/login?registered=true", window.location.href).href
        );
        return;
      }

      window.location.assign(new URL("/account", window.location.href).href);
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-300 px-4 py-12">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-[#031c43] px-8 py-9 text-white">
          <Link href="/" className="text-sm font-semibold text-blue-100 hover:text-white">
            ← Back to home
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/30 bg-blue-900 shadow-md">
              <Image
                src="/images/logo/samb-logo.jpeg"
                alt="SAMB's Logo"
                fill
                sizes="48px"
                className="object-cover"
              />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                SAMB&apos;S
              </p>
              <p className="text-xs font-medium text-blue-200">
                Laundry &amp; Klinin Services
              </p>
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-blue-100">
            Register to request services and manage your bookings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-8">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">
              Full name
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              className="text-black w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="text-black w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700">
              Phone number <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={30}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter your phone number"
              className="text-black w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Password field + strength indicator */}
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                autoCapitalize="none"
                spellCheck={false}
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="text-black w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 z-10 flex h-full w-12 touch-manipulation items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {/* Strength indicator — shown only once the user starts typing */}
            <PasswordStrengthIndicator password={password} />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter your password again"
                className="text-black w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 z-10 flex h-full w-12 touch-manipulation items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#031c43] px-5 py-3.5 font-semibold text-white transition hover:bg-[#031c43]/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating your account..." : "Create account"}
          </button>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-900 hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs leading-5 text-slate-500">
            Have a great experience with SAMB&apos;s Laundry &amp; Klinin Services
          </p>
        </form>
      </div>
    </main>
  );
}
