"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import type { ActivityLog, SystemHealth } from "@/lib/types";
import { Users, Briefcase, Clock, CheckCircle2 } from "lucide-react";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatEventMessage(log: ActivityLog): string {
  switch (log.event) {
    case "job_created":
      return `Created job "${log.jobTitle}"`;
    case "job_closed":
      return `Closed job "${log.jobTitle}"`;
    case "interview_scheduled":
      return `Scheduled interview${log.candidateName ? ` with ${log.candidateName}` : ""} for "${log.jobTitle}"`;
    case "application_submitted":
      return `New application from ${log.candidateName} for "${log.jobTitle}"`;
    case "recruiter_registered":
      return "New recruiter registered";
    default:
      return log.event;
  }
}

function getEventType(log: ActivityLog): "success" | "info" | "warning" {
  switch (log.event) {
    case "job_closed":
      return "warning";
    case "application_submitted":
      return "info";
    default:
      return "success";
  }
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "Just now";
}

export default function AdminPage() {
  const [stats, setStats] = useState<{
    totalApplicants: number;
    totalJobs: number;
    publishedJobs: number;
    closedJobs: number;
    systemUptime: number;
  } | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const activeToken = token;

    async function fetchData() {
      try {
        const [statsData, healthData, activityData] = await Promise.all([
          api.admin.getStats(activeToken).catch(() => null),
          api.admin.getSystemHealth().catch(() => null),
          api.admin.getActivityLogs(activeToken).catch(() => ({ activities: [] as ActivityLog[] })),
        ]);

        if (statsData) setStats(statsData);
        if (healthData) setHealth(healthData);
        if (activityData?.activities) setActivities(activityData.activities);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Admin</h1>
          <p className="text-slate-500">Platform overview and activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatTile
          label="Total Applicants"
          value={stats?.totalApplicants ?? 0}
          color="sky"
          icon={Users}
        />
        <StatTile
          label="Total Jobs"
          value={stats?.totalJobs ?? 0}
          color="indigo"
          icon={Briefcase}
        />
        <StatTile
          label="System Uptime"
          value={stats ? formatUptime(stats.systemUptime) : "0m"}
          color="cyan"
          icon={Clock}
        />
        <StatTile
          label="Active Jobs"
          value={stats?.publishedJobs ?? 0}
          color="violet"
          icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HealthTile
          label="API"
          status={health?.api ?? "connected"}
        />
        <HealthTile
          label="Database"
          status={health?.database ?? "connected"}
        />
        <HealthTile
          label="Last Backup"
          status="connected"
          customValue={health?.lastBackup ? new Date(health.lastBackup).toLocaleDateString() : "Never"}
        />
      </div>

      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-display text-xl font-bold text-on-surface flex items-center gap-2">
            Activity Log
          </h3>
        </div>

        {activities.length === 0 ? (
          <div className="text-center text-slate-400 py-8">No activity yet</div>
        ) : (
          <div className="space-y-3">
            {activities.map((log) => (
              <div key={log.id} className="flex gap-4 p-3 bg-white/30 border border-white/60 rounded-xl items-center">
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {formatTime(log.createdAt)}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  getEventType(log) === "success" ? "bg-green-400" :
                  getEventType(log) === "warning" ? "bg-amber-400" : "bg-sky-400"
                }`} />
                <span className="text-xs font-medium text-slate-600">{formatEventMessage(log)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, color, icon: Icon }: { label: string; value: string | number; color: string; icon: React.ComponentType<{ className?: string }> }) {
  const colors: Record<string, string> = {
    sky: "text-sky-500 bg-sky-50 border-sky-100",
    indigo: "text-indigo-500 bg-indigo-50 border-indigo-100",
    cyan: "text-cyan-500 bg-cyan-50 border-cyan-100",
    violet: "text-violet-500 bg-violet-50 border-violet-100",
  };

  return (
    <div className="glass-card p-6">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-on-surface">{value}</div>
      <div className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">{label}</div>
    </div>
  );
}

function HealthTile({ label, status, customValue }: { label: string; status: "connected" | "disconnected"; customValue?: string }) {
  const isConnected = status === "connected";

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
      </div>
      <div className="text-lg font-bold text-on-surface">
        {customValue ?? (isConnected ? "Healthy" : "Offline")}
      </div>
    </div>
  );
}