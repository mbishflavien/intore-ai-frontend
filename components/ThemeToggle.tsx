"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

/** Dark-mode toggle. Persists to localStorage via ThemeProvider. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-slate-500 transition-all hover:bg-white/20 hover:text-sky-500 dark:text-slate-300 dark:hover:bg-white/10 ${className}`.trim()}
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
