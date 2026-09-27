"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastTone;
  onClose: () => void;
  duration?: number;
}

const toneIcon = { success: CheckCircle2, error: AlertCircle, info: Info };
const toneClass = {
  success: "border-emerald-200 bg-emerald-50/90 text-emerald-800",
  error: "border-red-200 bg-red-50/90 text-red-800",
  info: "border-sky-200 bg-sky-50/90 text-sky-800",
};

/**
 * Toast — glass notification, auto-dismiss 3-5s, aria-live polite (never steals focus).
 */
export function Toast({ message, type, onClose, duration = 3500 }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const Icon = toneIcon[type];

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-4 top-4 z-[200] transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
    >
      <div
        className={`flex min-w-[300px] items-center gap-3 rounded-2xl border px-5 py-4 shadow-xl backdrop-blur-xl ${toneClass[type]}`}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          aria-label="Dismiss notification"
          className="min-h-[32px] min-w-[32px] rounded-full text-current/70 hover:text-current"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

