"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type FeedbackVariant = "success" | "error" | "warning" | "info";

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: FeedbackVariant;
  title: string;
  message: string;
  referenceNumber?: string;
  referenceLabel?: string;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
  };
}

export default function FeedbackModal({
  isOpen,
  onClose,
  variant = "success",
  title,
  message,
  referenceNumber,
  referenceLabel = "Reference",
  primaryAction,
  secondaryAction,
}: FeedbackModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

  // Keyboard accessibility and body scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus primary button when modal opens
    setTimeout(() => {
      primaryButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          icon: <CheckCircle2 className="h-10 w-10 text-emerald-600" />,
          badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          iconBg: "bg-emerald-100",
          primaryBtn:
            "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-200 text-white",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-10 w-10 text-rose-600" />,
          badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
          iconBg: "bg-rose-100",
          primaryBtn:
            "bg-rose-600 hover:bg-rose-700 focus:ring-rose-200 text-white",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="h-10 w-10 text-amber-600" />,
          badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
          iconBg: "bg-amber-100",
          primaryBtn:
            "bg-amber-600 hover:bg-amber-700 focus:ring-amber-200 text-white",
        };
      case "info":
      default:
        return {
          icon: <Info className="h-10 w-10 text-blue-600" />,
          badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
          iconBg: "bg-blue-100",
          primaryBtn:
            "bg-[#031c43] hover:bg-blue-900 focus:ring-blue-200 text-white",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all sm:p-8 text-center"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 shadow-inner">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${styles.iconBg}`}
          >
            {styles.icon}
          </div>
        </div>

        <h3
          id="feedback-modal-title"
          className="mt-5 text-2xl font-bold tracking-tight text-slate-900"
        >
          {typeof title === "string" ? title : String(title ?? "")}
        </h3>

        {referenceNumber && (
          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold ${styles.badgeBg}`}
            >
              <span>{typeof referenceLabel === "string" ? referenceLabel : "Reference"}:</span>
              <span className="font-mono font-bold tracking-wide">
                {typeof referenceNumber === "string" ? referenceNumber : String(referenceNumber ?? "")}
              </span>
            </span>
          </div>
        )}

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {typeof message === "string"
            ? message
            : typeof message === "object" && message !== null && "message" in message && typeof (message as { message: unknown }).message === "string"
              ? (message as { message: string }).message
              : typeof message === "object" && message !== null
                ? JSON.stringify(message)
                : String(message ?? "")}
        </p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          {primaryAction && (
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={() => {
                if (primaryAction.onClick) {
                  primaryAction.onClick();
                } else if (primaryAction.href) {
                  window.location.href = primaryAction.href;
                } else {
                  onClose();
                }
              }}
              className={`w-full sm:flex-1 rounded-xl px-5 py-3 text-sm font-semibold shadow-md transition focus:outline-none focus:ring-4 ${styles.primaryBtn}`}
            >
              {primaryAction.label}
            </button>
          )}

          {secondaryAction ? (
            <button
              type="button"
              onClick={secondaryAction.onClick || onClose}
              className="w-full sm:flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {secondaryAction.label}
            </button>
          ) : !primaryAction ? (
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={onClose}
              className={`w-full rounded-xl px-5 py-3 text-sm font-semibold shadow-md transition focus:outline-none focus:ring-4 ${styles.primaryBtn}`}
            >
              OK, Got it
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

