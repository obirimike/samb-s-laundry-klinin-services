"use client";

/**
 * PasswordStrengthIndicator
 *
 * Displays a colour-coded strength bar and a criteria checklist while the
 * user types a password. Intended for use on registration / password-change
 * forms only — never on login forms.
 */

interface Criterion {
  label: string;
  test: (pw: string) => boolean;
}

const CRITERIA: Criterion[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  {
    label: "Upper and lower-case letters",
    test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw),
  },
  { label: "At least one number", test: (pw) => /[0-9]/.test(pw) },
  {
    label: "At least one special character (!@#$…)",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

function getStrength(password: string): number {
  if (!password) return 0;
  return CRITERIA.reduce((score, c) => score + (c.test(password) ? 1 : 0), 0);
}

const STRENGTH_META = [
  { label: "", barClass: "" },
  { label: "Weak", barClass: "bg-red-500" },
  { label: "Fair", barClass: "bg-orange-400" },
  { label: "Good", barClass: "bg-yellow-400" },
  { label: "Strong", barClass: "bg-green-500" },
];

interface Props {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: Props) {
  if (!password) return null;

  const strength = getStrength(password);
  const meta = STRENGTH_META[strength];

  return (
    <div className="mt-3 space-y-2" aria-live="polite" aria-atomic="true">
      {/* Strength bar */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" role="presentation">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step <= strength ? meta.barClass : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        {meta.label && (
          <span
            className={`text-xs font-semibold ${
              strength === 1
                ? "text-red-600"
                : strength === 2
                  ? "text-orange-500"
                  : strength === 3
                    ? "text-yellow-600"
                    : "text-green-600"
            }`}
          >
            {meta.label}
          </span>
        )}
      </div>

      {/* Criteria checklist */}
      <ul className="space-y-1" aria-label="Password requirements">
        {CRITERIA.map((criterion) => {
          const met = criterion.test(password);
          return (
            <li key={criterion.label} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  met
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {met ? "✓" : "·"}
              </span>
              <span
                className={`text-xs transition-colors ${
                  met ? "text-green-700" : "text-slate-500"
                }`}
              >
                {criterion.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

