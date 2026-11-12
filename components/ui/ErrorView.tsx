"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShieldAlert,
  AlertTriangle,
  FileQuestion,
  Lock,
  RefreshCw,
  Home,
  LifeBuoy,
} from "lucide-react";

export type ErrorType =
  | "400"
  | "401"
  | "403"
  | "404"
  | "405"
  | "409"
  | "422"
  | "429"
  | "500"
  | "503";

interface ErrorViewProps {
  statusCode?: ErrorType | string;
  title: string;
  message: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  showSupport?: boolean;
  onRetry?: () => void;
}

export default function ErrorView({
  statusCode,
  title,
  message,
  primaryAction,
  secondaryAction,
  showSupport = true,
  onRetry,
}: ErrorViewProps) {
  const getIcon = () => {
    switch (statusCode) {
      case "401":
      case "403":
        return <Lock className="h-10 w-10 text-600" />;
      case "404":
        return <FileQuestion className="h-10 w-10 text-red-600" />;
      case "429":
        return <AlertTriangle className="h-10 w-10 text--600" />;
      case "500":
      case "503":
        return <ShieldAlert className="h-10 w-10 text-rose-600" />;
      default:
        return <AlertTriangle className="h-10 w-10 text-slate-700" />;
    }
  };

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center bg-[#050505] px-4 py-16 sm:px-6 lg:px-8 text-center">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-[#bedfed] p-8 shadow-xl sm:p-10">
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-blue-900 shadow-sm">
            <Image
              src="/images/logo/samb-logo.jpeg"
              alt="SAMB's Logo"
              fill
              sizes="40px"
              className="object-cover"
            />
          </span>
          <div className="text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-900">
              SAMB&apos;S
            </p>
            <p className="text-[10px] font-medium text-slate-500">
              Laundry &amp; Cleaning Services
            </p>
          </div>
        </div>

        {/* Status Code & Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 shadow-inner">
          {getIcon()}
        </div>

        {statusCode && (
          <p className="mt-4 text-xs font-mono font-bold tracking-widest text-slate-600 uppercase">
            Error {statusCode}
          </p>
        )}

        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl tracking-tight">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {message}
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition"
            >
              <RefreshCw size={16} />
              <span>Try again</span>
            </button>
          )}

          {primaryAction && (
            primaryAction.onClick ? (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#031c43] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-950 transition"
              >
                <span>{primaryAction.label}</span>
              </button>
            ) : (
              <Link
                href={primaryAction.href || "/"}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#031c43] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-950 transition"
              >
                <span>{primaryAction.label}</span>
              </Link>
            )
          )}

          {secondaryAction && (
            secondaryAction.onClick ? (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <span>{secondaryAction.label}</span>
              </button>
            ) : (
              <Link
                href={secondaryAction.href || "/"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <span>{secondaryAction.label}</span>
              </Link>
            )
          )}

          {!primaryAction && !onRetry && (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#031c43] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-950 transition"
            >
              <Home size={16} />
              <span>Return to homepage</span>
            </Link>
          )}
        </div>

        {/* Support Link */}
        {showSupport && (
          <div className="mt-8 border-t border-slate-100 pt-5 text-xs text-slate-500">
            <p>
              Need assistance?{" "}
              <Link
                href="/contact"
                className="font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                <LifeBuoy size={12} /> Contact SAMB&apos;s Support
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

