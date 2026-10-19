"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCheck, CheckCircle2, Filter } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Notification } from "@/lib/types";
import { Button, Card, Badge, CardSkeleton } from "@/components/ui";

const FILTERS = ["all", "unread", "interview_scheduled", "status_update", "job_published"] as const;
type Filter = (typeof FILTERS)[number];

function formatTime(createdAt: string) {
  return new Date(createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatType(type: string) {
  return type.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export default function NotificationsCenterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api.notifications.list()
      .then(({ notifications: list }) => {
        if (!cancelled) setNotifications(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load notifications");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const visible = useMemo(() => {
    const sorted = [...notifications].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (filter === "all") return sorted;
    if (filter === "unread") return sorted.filter((n) => !n.isRead);
    return sorted.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const markOne = async (id: string) => {
    if (!user) return;
    setActing(true);
    const prev = notifications;
    setNotifications((cur) => cur.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await api.notifications.markOne(id);
    } catch (e) {
      setNotifications(prev);
      setError(e instanceof Error ? e.message : "Failed to mark as read");
    } finally {
      setActing(false);
    }
  };

  const markAll = async () => {
    if (!user || unreadCount === 0) return;
    setActing(true);
    const prev = notifications;
    setNotifications((cur) => cur.map((n) => ({ ...n, isRead: true })));
    try {
      await api.notifications.readAll();
    } catch (e) {
      setNotifications(prev);
      setError(e instanceof Error ? e.message : "Failed to mark all as read");
    } finally {
      setActing(false);
    }
  };

  const openNotification = (n: Notification) => {
    const jobId = typeof n.data?.jobId === "string" ? n.data.jobId : null;
    if (n.type === "interview_scheduled") {
      router.push("/applicant/applications");
      return;
    }
    if (jobId) router.push(`/applicant/jobs/${jobId}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in px-1 sm:px-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-black tracking-tight text-on-surface sm:text-4xl">
            <Bell className="h-7 w-7 text-sky-500" aria-hidden="true" /> Notifications
          </h1>
          <p className="mt-1 text-slate-500">
            {loading ? "Loading updates…" : unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={markAll} disabled={acting || unreadCount === 0} aria-label="Mark all notifications as read">
          <CheckCheck className="h-4 w-4" aria-hidden="true" /> Mark all read
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter notifications">
        <Filter className="h-4 w-4 text-slate-400" aria-hidden="true" />
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`min-h-[44px] rounded-full px-4 text-xs font-bold transition-all ${filter === f ? "bg-primary text-white shadow-md" : "bg-white/60 text-slate-600 hover:bg-white/90"}`}
          >
            {f === "all" ? `All (${notifications.length})` : f === "unread" ? `Unread (${unreadCount})` : formatType(f)}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert">
          <Card className="border-red-200 bg-red-50/70 p-4 text-sm font-semibold text-red-700">
            {error}
          </Card>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center sm:p-16">
          <BellOff className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-slate-500">
            {filter === "all" ? "No notifications yet" : "Nothing matches this filter"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {filter === "all" ? "Interview invites, decisions, and new jobs will appear here." : "Try a different filter."}
          </p>
          {filter !== "all" && (
            <Button variant="secondary" size="sm" className="mt-5" onClick={() => setFilter("all")}>
              Show all
            </Button>
          )}
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((n) => (
            <li key={n.id}>
              <Card className={`p-4 transition-all sm:p-5 ${n.isRead ? "bg-white/60" : "border-sky-200 bg-sky-50/80 shadow-[0_8px_24px_rgba(56,189,248,0.12)]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{n.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={n.isRead ? "default" : "info"}>{formatType(n.type)}</Badge>
                      <span className="text-xs text-slate-400">{formatTime(n.createdAt)}</span>
                    </div>
                  </div>
                  {n.isRead ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                  ) : (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{n.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openNotification(n)}>
                    View details
                  </Button>
                  {!n.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => markOne(n.id)} disabled={acting}>
                      Mark as read
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-slate-400">
        <Link href="/applicant/jobs" className="font-semibold text-sky-600 underline hover:text-sky-800">Browse jobs</Link>
        {" · "}
        <Link href="/applicant/applications" className="font-semibold text-sky-600 underline hover:text-sky-800">Track applications</Link>
      </p>
    </div>
  );
}
