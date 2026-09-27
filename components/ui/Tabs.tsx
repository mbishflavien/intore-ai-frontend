"use client";

import { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

/**
 * Tabs — pill tab bar with aria tablist semantics.
 */
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div role="tablist" aria-label="Sections" className="glass-panel flex flex-wrap gap-1 p-1.5">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              selected
                ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-200"
                : "text-slate-500 hover:bg-white/70 hover:text-on-surface"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
