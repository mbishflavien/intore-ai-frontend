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
            className={`h-4 animate-pulse rounded-lg bg-slate-200/70 ${lineWidths[i % lineWidths.length]}`}
          />
        ))}
      </div>
    );
  }
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`.trim()} />;
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
