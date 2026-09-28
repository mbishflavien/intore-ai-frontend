"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "intore-sidebar-collapsed";

interface SidebarState {
  /** Desktop (lg+): true = icon-only pillar, false = expanded with labels. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Mobile (<lg): slide-over drawer. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function useSidebar(): SidebarState {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsed(stored !== "false");
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return { collapsed, toggleCollapsed, mobileOpen, setMobileOpen };
}
