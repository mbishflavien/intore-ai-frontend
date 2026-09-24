"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { 
  Search, 
  Bell,
  CheckCircle2,
  Settings, 
  Home, 
  Compass, 
  Layers, 
  User,
  LogOut,
  Target,
  Dna,
  GraduationCap,
  Bot
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Notification as AppNotification, TalentProfile } from "@/lib/types";

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, token } = useAuth();
  const bellRef = useRef<HTMLDivElement | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [profile, setProfile] = useState<TalentProfile | null>(null);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    if (!token || user?.role !== "applicant") return;

    const fetchNotifications = async () => {
      try {
        const data = await api.notifications.list(token);
        setNotifications(data.notifications);
      } catch (err) {
        console.error("Failed to fetch applicant notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== "applicant") return;

    const fetchProfile = async () => {
      try {
        const { profile: p } = await api.profiles.get(token);
        if (p) setProfile(p);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [token, user?.role]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationsOpen]);

  const handleBellClick = async () => {
    const nextOpenState = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpenState);

    if (!nextOpenState || unreadCount === 0 || !token) {
      return;
    }

    const previousNotifications = notifications;
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));

    try {
      await api.notifications.readAll(token);
    } catch (err) {
      console.error("Failed to mark applicant notifications as read:", err);
      setNotifications(previousNotifications);
    }
  };

  const formatNotificationTime = (createdAt: string) =>
    new Date(createdAt).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatNotificationType = (type: string) =>
    type
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const getNotificationJobId = (notification: AppNotification) => {
    const jobId = notification.data?.jobId;
    return typeof jobId === "string" ? jobId : null;
  };

  const handleNotificationClick = (notification: AppNotification) => {
    const jobId = getNotificationJobId(notification);
    if (!jobId) {
      return;
    }

    setIsNotificationsOpen(false);
    router.push(`/applicant/jobs/${jobId}`);
  };

  const navItems = [
    { icon: Home, href: "/applicant", label: "Dashboard" },
    { icon: Compass, href: "/applicant/jobs", label: "Browse Jobs" },
    { icon: Layers, href: "/applicant/applications", label: "My Applications" },
    { icon: Dna, href: "/applicant/challenges", label: "Assessments" },
    { icon: GraduationCap, href: "/applicant/training", label: "Learning Hub" },
    { icon: Bot, href: "/applicant/mentor", label: "AI Mentor" },
    { icon: User, href: "/applicant/profile", label: "My Profile" },
  ];

  return (
    <div className="min-h-screen bg-aura-gradient">
      {/* Top Glass Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center max-w-7xl mx-auto bg-white/40 backdrop-blur-2xl rounded-2xl mt-4 mx-6 px-6 py-3 border border-white/20 shadow-[0_20px_50px_rgba(56,189,248,0.1)]">
        <div className="flex items-center gap-4">
          <Link href="/applicant" className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500 font-display">
            IntoreAI
          </Link>
          <div className="hidden md:flex bg-white/30 border border-white/40 px-4 py-1.5 rounded-full items-center gap-3 backdrop-blur-md">
            <Search className="text-slate-400 w-4 h-4" />
            <input 
              className="bg-transparent border-none focus:ring-0 p-0 text-sm w-48 font-display text-on-surface placeholder:text-slate-400" 
              placeholder="Search jobs..." 
              type="text"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative" ref={bellRef}>
            <button
              className="p-2 text-slate-500 hover:bg-white/20 transition-all rounded-full"
              aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "No unread notifications"}
              aria-expanded={isNotificationsOpen}
              aria-haspopup="dialog"
              onClick={handleBellClick}
            >
              <Bell className="w-5 h-5" />
            </button>
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
                aria-hidden="true"
              />
            )}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 z-50 w-[22rem] rounded-3xl border border-white/40 bg-white/85 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
                <div className="mb-3 flex items-center justify-between px-2 pt-1">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    <p className="text-xs text-slate-500">
                      {notifications.length === 0
                        ? "No updates yet"
                        : unreadCount > 0
                          ? `${unreadCount} new update${unreadCount > 1 ? "s" : ""}`
                          : "All caught up"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Applicant
                  </span>
                </div>

                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
                    <p className="mt-1 text-xs text-slate-500">Accepted, rejected, and new job updates will appear here.</p>
                  </div>
                ) : (
                  <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        disabled={!getNotificationJobId(notification)}
                        className={`block w-full rounded-2xl border p-4 text-left transition-colors ${
                          notification.isRead
                            ? "border-slate-100 bg-white/60"
                            : "border-sky-200 bg-sky-50/90 shadow-[0_8px_24px_rgba(56,189,248,0.12)]"
                        } ${
                          getNotificationJobId(notification)
                            ? "cursor-pointer hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300/70"
                            : "cursor-default"
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {formatNotificationType(notification.type)}
                            </p>
                          </div>
                          {!notification.isRead ? (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                          ) : (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                          )}
                        </div>
                        <p className="text-sm leading-6 text-slate-700">{notification.message}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-slate-400">{formatNotificationTime(notification.createdAt)}</p>
                          {getNotificationJobId(notification) && (
                            <span className="text-[11px] font-semibold text-sky-600">View job</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Link 
            href="/applicant/profile"
            className="h-10 w-10 rounded-full border-2 border-white/60 overflow-hidden shadow-sm bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold hover:scale-105 transition-transform"
          >
            {(profile?.firstName?.[0] || user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}
          </Link>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Suspended Glass Pillar (Sidebar) */}
      <aside className="fixed left-6 top-24 bottom-24 w-20 flex flex-col items-center py-8 justify-between z-40 glass-pillar">
        <div className="flex flex-col items-center gap-1 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-200">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <nav className="flex flex-col gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                  isActive 
                    ? "bg-gradient-to-b from-sky-400 to-indigo-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)]" 
                    : "text-slate-400 hover:text-sky-500"
                }`}
                title={item.label}
              >
                <item.icon className="w-6 h-6" />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-3 text-slate-300">
          <Settings className="w-6 h-6" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pl-36 pr-12 pt-32 pb-12 max-w-[1440px] mx-auto">
        {children}
      </main>
    </div>
  );
}
