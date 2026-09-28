"use client";

interface SkeletonProps {
  className?: string;
  lines?: number;
}

const lineWidths = ["w-full", "w-11/12", "w-10/12", "w-9/12", "w-8/12", "w-7/12"];

/**
 * Skeleton — shimmer placeholder for async content (job lists, cards, widgets).
 * Respects prefers-reduced-motion via Tailwind animate-pulse.
 */
export function Skeleton({ className = "", lines = 0 }: SkeletonProps) {
  if (lines > 0) {
    return (
      <div className={`space-y-2 ${className}`.trim()} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-700/60 ${lineWidths[i % lineWidths.length]}`}
          />
        ))}
      </div>
    );
  }
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-700/60 ${className}`.trim()} />;
}

export function JobListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading jobs">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card p-6">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6" aria-label="Loading">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton lines={3} className="mt-4" />
    </div>
  );
}

/**
 * DashboardSkeleton — stat widgets row + two content panels.
 * Use for recruiter/applicant dashboards while stats load.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-3 h-8 w-1/2 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-6">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton lines={4} className="mt-4" />
        </div>
        <div className="glass-card p-6">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton lines={4} className="mt-4" />
        </div>
      </div>
    </div>
  );
}

/**
 * TableSkeleton — header + 5 placeholder rows.
 * Use for talent pool, applicant ranking, and archive lists.
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden" aria-label="Loading list">
      <div className="border-b border-white/60 p-4 dark:border-white/10">
        <Skeleton className="h-5 w-1/4" />
      </div>
      <div className="divide-y divide-white/40 dark:divide-white/10">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
