"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Rocket, 
  LineChart, 
  FileText, 
  Timer, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Settings
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface Job {
  id: string;
  title: string;
  status: string;
  requiredSkills: string[];
  createdAt: string;
  location?: string;
  updatedAt?: string;
}

interface Activity {
  type: "new_application" | "status_change";
  timestamp: string;
  candidateName: string;
  jobTitle: string;
  newStatus: string;
  previousStatus: string | null;
}

interface Stats {
  totalJobs: number;
  publishedJobs: number;
  draftJobs: number;
  closedJobs: number;
  avgMatch: number;
  totalApplicants: number;
  acceptedApplicants: number;
  timeSavedHours: number;
}

export default function RecruiterDashboard() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Stats>({ totalJobs: 0, publishedJobs: 0, draftJobs: 0, closedJobs: 0, avgMatch: 0, totalApplicants: 0, acceptedApplicants: 0, timeSavedHours: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== "recruiter") {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [jobList, activityData, adminStats] = await Promise.all([
          api.jobs.listByRecruiter(token),
          api.jobs.listActivity(token),
          api.admin.getStats(token)
        ]);

        setJobs(jobList.jobs);
        setActivities(activityData.activities as Activity[]);

        setStats({
          totalJobs: jobList.jobs.length,
          publishedJobs: jobList.jobs.filter((j: Job) => j.status === "published").length,
          draftJobs: jobList.jobs.filter((j: Job) => j.status === "draft").length,
          closedJobs: jobList.jobs.filter((j: Job) => j.status === "closed").length,
          avgMatch: adminStats.avgMatch || 0,
          totalApplicants: adminStats.totalApplicants || 0,
          acceptedApplicants: adminStats.acceptedApplicants || 0,
          timeSavedHours: adminStats.timeSavedHours || 0,
        });
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, user?.role]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <section className="animate-fade-in">
        <h1 className="font-display text-4xl font-bold text-on-surface tracking-tight mb-2">
          Good Morning, {user?.email?.split("@")[0]}
        </h1>
        <p className="text-slate-500 text-lg">
          You have {stats.publishedJobs} active job postings.
        </p>
      </section>

      {/* Snap-Cards Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Active Jobs" 
          value={stats.publishedJobs} 
          trend="+2.4%" 
          icon={Rocket} 
          color="sky" 
          delay="0s"
        />
        <MetricCard 
          title="Accepted applicants" 
          value={stats.acceptedApplicants.toLocaleString()} 
          trend="Total" 
          icon={FileText} 
          color="cyan" 
          delay="0.2s"
        />
        <MetricCard 
          title="Time Saved" 
          value={`${stats.timeSavedHours}h`} 
          trend="This Month" 
          icon={Timer} 
          color="amber" 
          delay="0.3s"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Workspace Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl font-bold text-on-surface">Active Job Workspace</h2>
            <Link href="/recruiter/jobs" className="text-sky-500 text-sm font-semibold flex items-center gap-1 hover:underline">
              View All Positions <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.slice(0, 4).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
            {jobs.length === 0 && (
              <div className="col-span-2 glass-card p-12 text-center">
                <p className="text-slate-400 mb-4">No active jobs found.</p>
                <Link 
                  href="/recruiter/jobs/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-full font-semibold shadow-lg shadow-sky-200 hover:scale-105 transition-all"
                >
                  Create New Job
                </Link>
              </div>
            )}
          </div>

          {/* Talent Scanner CTA */}
          <div className="glass-card p-8 bg-gradient-to-br from-white/60 to-sky-50/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-32 h-32 text-sky-500" />
            </div>
            <div className="relative z-10">
              <h3 className="font-display text-xl font-bold mb-2">Talent Scanner</h3>
              <p className="text-slate-500 mb-6 max-w-md">
                Drop resumes here to initiate AI candidate scoring. Our model will parse, score, and rank candidates against your job requirements.
              </p>
              <div className="flex gap-4">
                <Link 
                  href="/proofhire/recruiter"
                  className="px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Open Scanner
                </Link>
                <button className="px-6 py-3 bg-white/50 border border-white/60 rounded-2xl font-semibold hover:bg-white/80 transition-colors">
                  Upload Bulk
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Side Info Column */}
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl font-bold text-on-surface">Recent Activity</h2>
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live
            </span>
          </div>

          <div className="glass-card p-6 min-h-[500px] relative">
            <div className="dna-line opacity-20"></div>
            <div className="space-y-8 relative z-10">
              {activities.length === 0 ? (
                <p className="text-sm text-slate-400">No recent activity yet.</p>
              ) : (
                activities.slice(0, 5).map((activity, i) => (
                  <PulseItem 
                    key={i}
                    time={new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    title={activity.type === "new_application" ? "New Application" : "Status Changed"}
                    desc={`${activity.candidateName} - ${activity.jobTitle} (${activity.newStatus})`}
                    type={activity.type === "new_application" ? "upload" : "match"}
                  />
                ))
              )}
            </div>
            
            <button className="w-full mt-12 py-3 bg-surface-container hover:bg-sky-50 text-slate-600 rounded-2xl text-sm font-semibold transition-colors">
              View Complete Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, color, delay }: any) {
  const colors: any = {
    sky: "text-sky-400 bg-sky-50",
    indigo: "text-indigo-400 bg-indigo-50",
    cyan: "text-cyan-400 bg-cyan-50",
    amber: "text-amber-400 bg-amber-50",
  };

  return (
    <div 
      className="glass-card p-6 animate-float flex flex-col h-full" 
      style={{ animationDelay: delay }}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">{title}</span>
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mt-auto">
        <span className="text-3xl font-bold font-display">{value}</span>
        <span className={`text-[10px] font-bold whitespace-nowrap ${trend === 'Good' ? 'text-sky-500' : 'text-green-500'}`}>
          {trend}
        </span>
      </div>
      <div className="mt-4 h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden flex">
        <div className={`h-full opacity-60 rounded-full ${color === 'sky' ? 'bg-sky-400' : color === 'indigo' ? 'bg-indigo-400' : color === 'cyan' ? 'bg-cyan-400' : 'bg-amber-400'}`} style={{ width: '70%' }}></div>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/recruiter/jobs/${job.id}`} className="glass-card p-6 hover:translate-y-[-4px] transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] ${job.status === 'published' ? 'bg-green-500' : job.status === 'draft' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
          <span className="text-slate-400 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
            {job.status === 'published' ? 'Active' : job.status === 'draft' ? 'Draft' : 'Closed'}
          </span>
        </div>
      </div>
      <h4 className="font-display font-bold text-lg mb-1 group-hover:text-sky-600 transition-colors">{job.title}</h4>
      <p className="text-xs text-slate-400 mb-4 capitalize">{job.location || 'No location'}</p>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
        <ExternalLink className="w-4 h-4 text-sky-500" />
      </div>
    </Link>
  );
}

function PulseItem({ time, title, desc, type }: any) {
  const icons: any = {
    match: { icon: TrendingUp, color: "text-sky-500 bg-sky-50 border-sky-100" },
    upload: { icon: Activity, color: "text-indigo-500 bg-indigo-50 border-indigo-100" },
    advance: { icon: Activity, color: "text-green-500 bg-green-50 border-green-100" },
    new_application: { icon: Activity, color: "text-indigo-500 bg-indigo-50 border-indigo-100" },
    status_change: { icon: TrendingUp, color: "text-sky-500 bg-sky-50 border-sky-100" },
  };
  
  const { icon: Icon, color } = icons[type] || icons.match;

  return (
    <div className="flex gap-4 group">
      <div className="relative">
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center relative z-10 bg-white ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">{time}</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest whitespace-nowrap">{title}</span>
        </div>
        <p className="text-sm text-on-surface font-medium leading-tight">{desc}</p>
      </div>
    </div>
  );
}
