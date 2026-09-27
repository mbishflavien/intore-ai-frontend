"use client";

import { ReactNode } from "react";

type BadgeTone = "default" | "success" | "warning" | "danger" | "info" | "level-beginner" | "level-intermediate" | "level-advanced";

const toneClass: Record<BadgeTone, string> = {
  default: "bg-slate-100 text-slate-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-600",
  "level-beginner": "bg-emerald-50 text-emerald-600",
  "level-intermediate": "bg-amber-50 text-amber-600",
  "level-advanced": "bg-rose-50 text-rose-600",
};

/**
 * Badge — pill status label. Always pairs color + text (never color alone).
 */
export function Badge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClass[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
