"use client";

import Link from "next/link";
import { useEffect, type ComponentType, type ReactNode } from "react";
import { ChevronsLeft, ChevronsRight, X } from "lucide-react";

export interface SidebarItem {
  icon: ComponentType<{ className?: string }>;
  href: string;
  label: string;
}

interface AppSidebarProps {
  items: SidebarItem[];
  pathname: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  brandIcon: ComponentType<{ className?: string }>;
  bottomSlot?: ReactNode;
  ariaLabel?: string;
}

function NavList({ items, pathname, collapsed, onNavigate, brandIcon: BrandIcon, bottomSlot, onToggleCollapsed }: Omit<AppSidebarProps, "mobileOpen" | "onCloseMobile" | "ariaLabel"> & { onNavigate?: () => void }) {
  return (
    <div className={`flex h-full flex-col items-center py-8 ${collapsed ? "" : "items-stretch px-4"}`}>
      <div className={`mb-8 flex items-center gap-2 ${collapsed ? "flex-col" : ""}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-200">
          <BrandIcon className="h-5 w-5" />
        </div>
        {!collapsed && <span className="font-display text-lg font-black tracking-tight text-on-surface">IntoreAI</span>}
      </div>

      <nav className={`flex flex-col ${collapsed ? "gap-6" : "w-full gap-1.5"}`} aria-label="Primary">
        {items.map((item) => {
          const isActive = pathname === item.href;
          if (collapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full p-3 transition-all duration-300 hover:scale-110 ${
                  isActive
                    ? "bg-gradient-to-b from-sky-400 to-indigo-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                    : "text-slate-400 hover:text-sky-500 dark:text-slate-500 dark:hover:text-sky-400"
                }`}
              >
                <item.icon className="h-6 w-6" />
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[44px] items-center gap-3 rounded-2xl px-4 text-sm font-bold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                  : "text-slate-500 hover:bg-white/50 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-sky-400"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={`mt-auto flex ${collapsed ? "flex-col items-center" : "items-center justify-between gap-2"}`}>
        {bottomSlot}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-3 text-slate-400 transition-all hover:scale-110 hover:text-sky-500 dark:text-slate-500 dark:hover:text-sky-400"
        >
          {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

/**
 * Shared responsive sidebar (Friend — design system).
 * - Desktop (lg+): glass pillar, collapsible icon-only ↔ labeled, persisted.
 * - Mobile (<lg): hidden; opens as a slide-over drawer via the header hamburger.
 */
export function AppSidebar(props: AppSidebarProps) {
  const { collapsed, mobileOpen, onCloseMobile } = props;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      {/* Desktop pillar */}
      <aside
        className={`fixed bottom-24 left-6 top-24 z-40 hidden justify-between glass-pillar lg:flex ${
          collapsed ? "w-20 flex-col items-center" : "w-60"
        }`}
        aria-label={props.ariaLabel ?? "Sidebar"}
      >
        <NavList {...props} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onCloseMobile} aria-hidden="true" />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={props.ariaLabel ?? "Menu"}
            className="glass-pillar absolute bottom-4 left-4 top-4 flex w-72 !rounded-3xl"
          >
            <div className="flex h-full w-full flex-col px-2">
              <div className="flex items-center justify-end px-3 pt-3">
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close menu"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-500 hover:bg-white/40 dark:text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <NavList {...props} collapsed={false} onNavigate={onCloseMobile} />
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
