"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Briefcase,
  TrendingUp,
  Award,
  CirclePlay,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Application, Job, Notification } from "@/lib/types";
import { Card, Badge, Tabs, Skeleton } from "@/components/ui";

/** 5-stage pipeline: Applied → Screened → Shortlisted → Interview → Decision */
const STAGES = ["Applied", "Screened", "Shortlisted", "Interview", "Decision"] as const;

type StageState = "completed" | "current" | "upcoming" | "failed";

interface ResolvedApplication {
  app: Application;
  stageIndex: number;
  decided: boolean;
  won: boolean;
  lost: boolean;
  hasInterview: boolean;
}

function resolveStage(app: Application, interviewJobIds: Set<string>): ResolvedApplication {
  const lost = app.status === "rejected";
  const won = app.status === "accepted";
  const decided = won || lost;
  const hasInterview = interviewJobIds.has(app.jobId);
  let stageIndex = 0;
  if (decided) stageIndex = 4;
  else if (hasInterview || app.status === "shortlisted") stageIndex = hasInterview ? 3 : 2;
  else if (app.status === "under_review" || app.screeningResult) stageIndex = 1;
  return { app, stageIndex, decided, won, lost, hasInterview };
}

function stageState(
  stageIdx: number,
  resolved: ResolvedApplication,
): StageState {
  if (resolved.lost) return stageIdx < 4 ? "completed" : "failed";
  if (resolved.won) return "completed";
  if (stageIdx < resolved.stageIndex) return "completed";
  if (stageIdx === resolved.stageIndex) return "current";
  return "upcoming";
}

const nodeClass: Record<StageState, string> = {
  completed: "bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
  current: "bg-sky-500 border-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.7)] animate-pulse",
  upcoming: "bg-white border-slate-200",
  failed: "bg-red-500 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
};

const labelClass: Record<StageState, string> = {
  completed: "text-on-surface",
  current: "text-sky-600",
  upcoming: "text-slate-300",
  failed: "text-red-600",
};

export default function ApplicationsPage() {
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!token) return;
    const fetchAll = async () => {
      try {
        const [{ applications: appList }, { notifications: notifs }] = await Promise.all([
          api.applications.list(token),
          api.notifications.list(token).catch(() => ({ notifications: [] as Notification[] })),
        ]);
        setApplications(appList);
        setNotifications(notifs);
      } catch (err) {
        console.error("Failed to fetch application journeys:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  useEffect(() => {
    api.jobs
      .list()
      .then(({ jobs: jobList }) => setJobs(jobList))
      .catch((err) => console.error("Failed to fetch jobs:", err));
  }, []);

  const interviewJobIds = useMemo(() => {
    const ids = new Set<string>();
    for (const n of notifications) {
      const jobId = n.data?.jobId;
      if (n.type === "interview_scheduled" && typeof jobId === "string") ids.add(jobId);
    }
    return ids;
  }, [notifications]);

  const resolved = useMemo(
    () => applications.map((app) => resolveStage(app, interviewJobIds)),
    [applications, interviewJobIds],
  );

  const jobById = useMemo(() => {
    const map = new Map<string, Job>();
    jobs.forEach((j) => map.set(j.id, j));
    return map;
  }, [jobs]);

  const filtered = useMemo(() => {
    if (filter === "active") return resolved.filter((r) => !r.decided);
    if (filter === "shortlisted")
      return resolved.filter((r) => r.app.status === "shortlisted" || r.hasInterview);
    if (filter === "decision") return resolved.filter((r) => r.decided);
    return resolved;
  }, [resolved, filter]);

  const stats = useMemo(
    () => ({
      total: resolved.length,
      active: resolved.filter((r) => !r.decided).length,
      shortlisted: resolved.filter((r) => r.app.status === "shortlisted" || r.hasInterview).length,
      offers: resolved.filter((r) => r.won).length,
    }),
    [resolved],
  );

  if (isLoading) {
    return (
      <div className="space-y-6" aria-label="Loading applications">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="md">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-3 h-8 w-1/3" />
            </Card>
          ))}
        </div>
        <Card padding="lg">
          <Skeleton lines={4} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/applicant"
          aria-label="Back to dashboard"
          className="btn-ghost min-h-[44px] min-w-[44px] rounded-full hover:bg-white/40"
        >
          <ArrowLeft className="h-6 w-6 text-slate-400" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">
            My Applications
          </h1>
          <p className="text-slate-500">Applied → Screened → Shortlisted → Interview → Decision.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Total applied" value={stats.total} tone="text-sky-500 bg-sky-50" />
        <StatCard icon={Clock} label="In progress" value={stats.active} tone="text-indigo-500 bg-indigo-50" />
        <StatCard icon={TrendingUp} label="Shortlisted" value={stats.shortlisted} tone="text-amber-500 bg-amber-50" />
        <StatCard icon={Award} label="Offers" value={stats.offers} tone="text-emerald-500 bg-emerald-50" />
      </div>

      <Tabs
        tabs={[
          { id: "all", label: `All (${stats.total})` },
          { id: "active", label: `Active (${stats.active})` },
          { id: "shortlisted", label: `Shortlisted (${stats.shortlisted})` },
          { id: "decision", label: "Decisions" },
        ]}
        active={filter}
        onChange={setFilter}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {filtered.map((r) => (
            <JourneyCard
              key={r.app.id}
              resolved={r}
              jobTitle={jobById.get(r.app.jobId)?.title ?? `Job ${r.app.jobId.slice(0, 8)}`}
            />
          ))}

          {filtered.length === 0 && (
            <Card padding="lg" className="p-20 text-center">
              <span className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[32px] bg-slate-50 text-slate-200">
                <Layers className="h-10 w-10" aria-hidden="true" />
              </span>
              <h3 className="text-xl font-bold text-slate-400">
                {applications.length === 0 ? "No Applications" : "Nothing in this lane"}
              </h3>
              <p className="mt-2 text-slate-400">
                {applications.length === 0
                  ? "Start by applying to jobs."
                  : "Try a different filter."}
              </p>
              {applications.length === 0 && (
                <Link href="/applicant/jobs" className="btn-primary mt-8 inline-flex rounded-xl px-8 py-3 font-bold">
                  Enter Discovery Lane
                </Link>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-sky-600">
              How the pipeline works
            </p>
            <ol className="relative space-y-5">
              <span aria-hidden="true" className="absolute bottom-0 left-[7px] top-0 w-[2px] bg-sky-100" />
              {[
                ["Applied", "Your profile reached the recruiter."],
                ["Screened", "AI scores your fit against the role."],
                ["Shortlisted", "A human recruiter picked you."],
                ["Interview", "Scheduled via notifications."],
                ["Decision", "Accepted or rejected — always notified."],
              ].map(([title, desc]) => (
                <li key={title} className="relative pl-6">
                  <span aria-hidden="true" className="absolute left-0 top-[3px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-sky-100 bg-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
                  </span>
                  <p className="text-xs font-bold text-slate-700">{title}</p>
                  <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="border-indigo-100 bg-indigo-50/20">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              Optimization Tip
            </p>
            <p className="text-xs font-medium leading-relaxed text-slate-600">
              Applicants who complete the <strong>Talent Assessment</strong> within 24 hours
              have a <strong>15% higher success rate</strong>. Practice first in the Prep Room —
              it never touches your record.
            </p>
            <Link
              href="/applicant/prep"
              className="btn-secondary mt-4 inline-flex w-full rounded-xl py-2.5 text-sm"
            >
              <CirclePlay className="h-4 w-4" aria-hidden="true" /> Open Prep Room
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Briefcase;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card padding="md" className="flex items-center gap-4">
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block font-display text-2xl font-black text-on-surface">{value}</span>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </span>
    </Card>
  );
}

function JourneyCard({ resolved, jobTitle }: { resolved: ResolvedApplication; jobTitle: string }) {
  const { app, won, lost, hasInterview } = resolved;
  const badgeTone = lost ? "danger" : won ? "success" : app.status === "shortlisted" || hasInterview ? "warning" : "info";
  const myScore = app.screeningResult?.shortlisted.find((c) => c.applicantId === app.applicantId)?.score.total;

  return (
    <Card padding="lg" className="group relative overflow-hidden hover:border-sky-200">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-on-surface transition-colors group-hover:text-sky-600">
            {jobTitle}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <span>Job {app.jobId.slice(0, 8)}</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Full-Time</span>
          </p>
        </div>
        <Badge tone={badgeTone}>{app.status.replace("_", " ")}</Badge>
      </div>

      <ol aria-label={`Progress for ${jobTitle}`} className="relative mb-8 flex items-center justify-between px-4">
        <span aria-hidden="true" className="absolute left-8 right-8 z-0 h-[2px] bg-slate-100" />
        {STAGES.map((label, idx) => {
          const state = stageState(idx, resolved);
          return (
            <li key={label} className="relative z-10 flex flex-col items-center gap-2">
              <span aria-hidden="true" className={`h-4 w-4 rounded-full border-2 transition-all duration-500 ${nodeClass[state]}`} />
              <span className={`text-[9px] font-black uppercase tracking-tighter ${labelClass[state]}`}>
                {label}
              </span>
              <span className="sr-only">
                {label}: {state}
              </span>
            </li>
          );
        })}
      </ol>

      {(myScore !== undefined || app.proofScore !== undefined || hasInterview) && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {myScore !== undefined && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 font-bold text-sky-700">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> AI fit {Math.round(myScore)}%
            </span>
          )}
          {app.proofScore !== undefined && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Assessment {app.proofScore}%
            </span>
          )}
          {hasInterview && !resolved.decided && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Interview scheduled — check notifications
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/60 pt-6">
        <div className="flex flex-wrap items-center gap-4">
          {app.proofScore !== undefined ? (
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Assessment Score: {app.proofScore}%
            </span>
          ) : (
            <Link
              href={`/proofhire/applicant/jobs/${app.jobId}`}
              className="flex min-h-[44px] items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky-500 hover:underline"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> Start Assessment
            </Link>
          )}
          {won && (
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              <Award className="h-4 w-4" aria-hidden="true" /> Offer received — congratulations
            </span>
          )}
          {lost && (
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <XCircle className="h-4 w-4" aria-hidden="true" /> Not moving forward — keep practicing
            </span>
          )}
        </div>

        <Link
          href={`/applicant/jobs/${app.jobId}`}
          aria-label={`View job ${jobTitle}`}
          className="rounded-xl bg-slate-50 p-2 text-slate-400 transition-all hover:bg-sky-50 hover:text-sky-500"
        >
          <ExternalLink className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
