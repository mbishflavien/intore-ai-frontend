"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}

/**
 * Modal — glass-panel dialog with Escape-to-close + scrim.
 */
export function Modal({ open, onClose, title, children, wide = false }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Dialog"}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-sm"
      />
      <div
        className={`glass-panel relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} p-6 shadow-[0_24px_60px_rgba(15,23,42,0.25)]`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && (
            <h2 className="font-display text-xl font-bold text-on-surface tracking-tight">{title}</h2>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-ghost min-h-[44px] min-w-[44px] rounded-full hover:bg-surface-container"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
