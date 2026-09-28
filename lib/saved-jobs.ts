"use client";

const KEY = "intore_saved_jobs_v1";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function getSavedJobIds(): string[] {
  return readIds();
}

export function isJobSaved(jobId: string): boolean {
  return readIds().includes(jobId);
}

export function toggleSavedJob(jobId: string): string[] {
  const ids = readIds();
  const next = ids.includes(jobId) ? ids.filter((id) => id !== jobId) : [...ids, jobId];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full/blocked — bookmarks are best-effort only
  }
  // Notify other tabs/components in the same window.
  try {
    window.dispatchEvent(new CustomEvent("intore:saved-jobs", { detail: next }));
  } catch {
    // ignore
  }
  return next;
}
