"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, LoaderCircle, X, ShieldAlert } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  recordName?: string;
  consequences?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  requireConfirmationText?: string;
  confirmationPlaceholder?: string;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  recordName,
  consequences,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  requireConfirmationText,
  confirmationPlaceholder,
  isLoading = false,
}: ConfirmModalProps) {
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  // Wrap handlers to clear the typed confirmation field when the modal closes.
  function handleClose() {
    setTypedConfirmation("");
    onClose();
  }

  async function handleConfirm() {
    await onConfirm();
    setTypedConfirmation("");
  }

  // Keyboard accessibility and body scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        handleClose();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  const isConfirmedPhrase = requireConfirmationText
    ? typedConfirmation.trim().toLowerCase() ===
      requireConfirmationText.trim().toLowerCase()
    : true;

  const isSubmitDisabled = isLoading || !isConfirmedPhrase;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isLoading) handleClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all sm:p-8"
      >
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              isDestructive
                ? "bg-rose-100 text-rose-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            {isDestructive ? <ShieldAlert size={26} /> : <AlertTriangle size={26} />}
          </div>

          <div className="flex-1">
            <h3
              id="confirm-modal-title"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              {title}
            </h3>

            {recordName && (
              <p className="mt-1 font-semibold text-blue-900 break-words">
                {recordName}
              </p>
            )}

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {description}
            </p>

            {consequences && (
              <div
                className={`mt-4 rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isDestructive
                    ? "bg-rose-50 text-rose-800 border border-rose-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                <span className="font-bold">Consequence: </span>
                {consequences}
              </div>
            )}

            {requireConfirmationText && (
              <div className="mt-4 space-y-2">
                <label
                  htmlFor="confirm-input-text"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Type <span className="font-mono font-bold text-slate-900">&quot;{requireConfirmationText}&quot;</span> to confirm:
                </label>
                <input
                  id="confirm-input-text"
                  type="text"
                  value={typedConfirmation}
                  onChange={(e) => setTypedConfirmation(e.target.value)}
                  disabled={isLoading}
                  placeholder={confirmationPlaceholder || requireConfirmationText}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitDisabled}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDestructive
                    ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-200"
                    : "bg-blue-700 hover:bg-blue-800 focus:ring-blue-200"
                }`}
              >
                {isLoading && <LoaderCircle size={16} className="animate-spin" />}
                <span>{confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

