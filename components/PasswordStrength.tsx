"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import type { ZxcvbnResult } from "@zxcvbn-ts/core";

/**
 * Live password feedback. The rules mirror the API's policy (security/passwordPolicy.ts);
 * the server is the one that enforces them — plus the common-password list and the
 * Have I Been Pwned breach check, which only run there.
 */
export const PASSWORD_MIN_LENGTH = 12;

export function passwordRules(password: string) {
  return [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, ok: password.length >= PASSWORD_MIN_LENGTH },
    { label: "Upper and lowercase letters", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "A number", ok: /[0-9]/.test(password) },
    { label: "A symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

/** zxcvbn's dictionaries are ~1 MB, so they load only when this component mounts. */
let checker: Promise<(password: string, userInputs: string[]) => ZxcvbnResult> | null = null;
function loadChecker() {
  checker ??= Promise.all([
    import("@zxcvbn-ts/core"),
    import("@zxcvbn-ts/language-common"),
    import("@zxcvbn-ts/language-en"),
  ]).then(([core, common, en]) => {
    const factory = new core.ZxcvbnFactory({
      translations: en.translations,
      graphs: common.adjacencyGraphs,
      dictionary: { ...common.dictionary, ...en.dictionary },
    });
    return (password: string, userInputs: string[]) => factory.check(password, userInputs);
  });
  return checker;
}

const LEVELS = [
  { label: "Very weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Weak", bar: "bg-orange-500", text: "text-orange-600" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-600" },
  { label: "Very strong", bar: "bg-emerald-600", text: "text-emerald-700" },
];

/** Minimum zxcvbn score the form accepts before sending (the server re-checks everything). */
export const MIN_STRENGTH_SCORE = 3;

export function PasswordStrength({
  password,
  userInputs = [],
  onChange,
}: {
  password: string;
  userInputs?: string[];
  onChange?: (state: { acceptable: boolean; score: number }) => void;
}) {
  const [result, setResult] = useState<ZxcvbnResult | null>(null);
  const rules = useMemo(() => passwordRules(password), [password]);
  const inputsKey = userInputs.join("\u0000");

  useEffect(() => {
    let cancelled = false;
    if (!password) {
      setResult(null);
      return;
    }
    loadChecker().then((check) => {
      if (!cancelled) setResult(check(password, inputsKey ? inputsKey.split("\u0000") : []));
    });
    return () => {
      cancelled = true;
    };
  }, [password, inputsKey]);

  const score = password ? (result?.score ?? 0) : 0;
  const acceptable = rules.every((rule) => rule.ok) && score >= MIN_STRENGTH_SCORE;

  useEffect(() => {
    onChange?.({ acceptable, score });
  }, [acceptable, score, onChange]);

  if (!password) return null;
  const level = LEVELS[score];

  return (
    <div className="mt-3 space-y-3" aria-live="polite">
      <div>
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${score > i ? level.bar : "bg-slate-200"}`} />
          ))}
        </div>
        <p className={`mt-1.5 text-xs font-semibold ${level.text}`}>
          Strength: {level.label}
          {result?.feedback.warning ? <span className="font-normal text-slate-500"> — {result.feedback.warning}</span> : null}
        </p>
        {result && score < MIN_STRENGTH_SCORE && result.feedback.suggestions[0] ? (
          <p className="mt-0.5 text-xs text-slate-500">{result.feedback.suggestions[0]}</p>
        ) : null}
      </div>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {rules.map((rule) => (
          <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.ok ? "text-emerald-600" : "text-slate-500"}`}>
            {rule.ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>{rule.label}</span>
            <span className="sr-only">{rule.ok ? "(met)" : "(not met)"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
