"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { 
  Search, 
  Bell, 
  Settings, 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  FolderHeart, 
//   Lock,
  Plus,
  Rocket,
  LogOut,
  Clock
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await api.notifications.listUnread(token);
      setUnreadCount(data.unreadCount);
      setNotifications(data.notifications);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "recruiter") {
      router.replace("/applicant");
    }
  }, [router, user, isLoading]);

  // Fetch notifications on mount and poll every 30 seconds
  useEffect(() => {
    if (!token || user?.role !== "recruiter") return;
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, user?.role]);

  // Handle click outside notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = async () => {
    const nextState = !isNotificationsOpen;
    setIsNotificationsOpen(nextState);

    if (nextState && unreadCount > 0 && token) {
      try {
        await api.notifications.readAll(token);
        setUnreadCount(0);
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    }
  };

  if (isLoading || (user && user.role !== "recruiter")) {
    return null;
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { icon: LayoutDashboard, href: "/recruiter", label: "Dashboard" },
    { icon: Briefcase, href: "/recruiter/jobs", label: "Job Workspace" },
    { icon: Users, href: "/recruiter/talent", label: "Talent Pool" },
    { icon: FolderHeart, href: "/recruiter/archive", label: "Archive" },
    // { icon: Lock, href: "/recruiter/admin", label: "Admin" },
  ];

  return (
    <div className="min-h-screen bg-aura-gradient">
      {/* Top Glass Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center max-w-7xl mx-auto bg-white/40 backdrop-blur-2xl rounded-2xl mt-4 mx-6 px-6 py-3 border border-white/20 shadow-[0_20px_50px_rgba(56,189,248,0.1)]">
        <div className="flex items-center gap-4">
          <Link href="/recruiter" className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500 font-display">
            IntoreAI
          </Link>
          <div className="hidden md:flex bg-white/30 border border-white/40 px-4 py-1.5 rounded-full items-center gap-3 backdrop-blur-md group transition-all duration-300 focus-within:ring-2 ring-primary-container/50">
            <Search className="text-slate-400 w-4 h-4" />
            <input 
              className="bg-transparent border-none focus:ring-0 p-0 text-sm w-48 font-display text-on-surface placeholder:text-slate-400" 
              placeholder="Quick search..." 
              type="text"
            />
            <kbd className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded border border-white/60 text-slate-400">⌘K</kbd>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative" ref={bellRef}>
            <button 
              onClick={handleBellClick}
              className={`p-2 transition-all rounded-full ${isNotificationsOpen ? 'bg-white/40 text-sky-500' : 'text-slate-500 hover:bg-white/20'}`}
            >
              <Bell className="w-5 h-5" />
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white/40">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-4 w-80 bg-white/85 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.18)] overflow-hidden z-50 animate-fade-in">
                <div className="p-4 border-b border-white/40 flex justify-between items-center bg-white/40">
                  <h3 className="font-display font-bold text-slate-900">Notifications</h3>
                  <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded-full">Recruiter</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-slate-500 font-medium">No unread notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification, i) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 border-b border-white/20 hover:bg-white/50 transition-colors group cursor-default ${i === 0 ? 'bg-sky-50/40' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-500'}`}>
                            {i === 0 ? <Rocket className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-900">
                              New Application for <span className="text-sky-600">{notification.jobTitle}</span>
                            </p>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              <span className="font-semibold text-slate-900">{notification.candidateName}</span> has applied. AI scoring initiated.
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                              {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button className="w-full p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:bg-white/60 transition-colors">
                  View Complete History
                </button>
              </div>
            )}
          </div>
          <button className="p-2 text-slate-500 hover:bg-white/20 transition-all rounded-full">
            <Settings className="w-5 h-5" />
          </button>
          <div className="h-10 w-10 rounded-full border-2 border-white/60 overflow-hidden shadow-sm bg-primary-fixed flex items-center justify-center text-primary font-bold">
            {(user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Suspended Glass Pillar (Sidebar) */}
      <aside className="fixed left-6 top-24 bottom-24 w-20 flex flex-col items-center py-8 justify-between z-40 glass-pillar">
        <div className="flex flex-col items-center gap-1 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-200">
            <Rocket className="w-5 h-5" />
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

        <div className="mt-auto">
          <Link 
            href="/recruiter/jobs/new"
            className="w-12 h-12 rounded-full border border-sky-400/30 flex items-center justify-center text-sky-500 hover:bg-sky-50 transition-colors shadow-sm"
          >
            <Plus className="w-6 h-6" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pl-36 pr-12 pt-32 pb-12 max-w-[1440px] mx-auto">
        {children}
      </main>
    </div>
  );
}
