"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  LineChart, 
  Timer, 
  ChevronRight,
  Zap,
  TrendingUp,
  Activity,
  Layers,
  Award,
  MapPin,
  Clock
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface Job {
  id: string;
  title: string;
  summary: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minimumYearsExperience: number;
  educationLevel?: string;
  location?: string;
  dealbreakers?: string[];
  status: string;
  createdAt: string;
}

function getJobTitle(jobId: string, jobs: Job[]): string {
  const job = jobs.find((j) => j.id === jobId);
  return job?.title || `Job ${jobId.slice(0, 8)}`;
}

export default function ApplicantDashboard() {
  const { token, user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchApps = async () => {
      try {
        const { applications: appList } = await api.applications.list(token);
        setApplications(appList);
        setStats({
          total: appList.length,
          pending: appList.filter((a: any) => a.status === "submitted").length,
          completed: appList.filter((a: any) => ["accepted", "rejected"].includes(a.status)).length,
        });
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, [token]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { jobs: jobList } = await api.jobs.list();
        console.log("Jobs fetched:", jobList);
        setJobs(jobList);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      }
    };
    fetchJobs();
  }, []);

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
          Welcome back, {user?.firstName || user?.email?.split("@")[0]}
        </h1>
      </section>

      {/* Snap-Cards Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard 
          title="Total Applications" 
          value={stats.total} 
          trend="Total" 
          icon={FileText} 
          color="sky" 
          delay="0s"
        />
        <MetricCard 
          title="Pending Applications" 
          value={stats.pending} 
          icon={Activity} 
          color="indigo" 
          delay="0.1s"
        />
        {/* <MetricCard 
          title="Profile Score" 
          value="88%" 
          trend="+1.2%" 
          icon={Award} 
          color="cyan" 
          delay="0.2s"
        /> */}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Applications Workspace */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl font-bold text-on-surface">My Applications</h2>
            <Link href="/applicant/applications" className="text-sky-500 text-sm font-semibold flex items-center gap-1 hover:underline">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {applications.slice(0, 3).map((app) => (
              <ApplicationCard key={app.id} application={app} jobTitle={getJobTitle(app.jobId, jobs)} />
            ))}
            {applications.length === 0 && (
              <div className="glass-card p-12 text-center">
                <p className="text-slate-400 mb-4">No active applications found.</p>
                <Link 
                  href="/applicant/jobs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-full font-semibold shadow-lg shadow-sky-200 hover:scale-105 transition-all"
                >
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>

          </div>

          {/* Side Recommendations */}
          <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl font-bold text-on-surface">Recommended</h2>
            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest bg-sky-50 px-2 py-1 rounded-full">
              Matched for you
            </span>
          </div>

          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-slate-400 mb-4">No jobs available yet.</p>
                <p className="text-xs text-slate-500">Check back later for new opportunities.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <Link key={job.id} href={`/applicant/jobs/${job.id}`} className="glass-card p-4 hover:border-sky-200 transition-all block group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-on-surface leading-tight group-hover:text-sky-600 transition-colors">{job.title}</h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-50 text-sky-500">Match</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {job.minimumYearsExperience}+ yrs
                    </span>
                  </div>
                </Link>
              ))
            )}
            
            <Link href="/applicant/jobs" className="w-full mt-4 py-3 bg-surface-container hover:bg-sky-50 text-slate-600 rounded-2xl text-sm font-semibold transition-colors text-center block">
              Explore All Matches
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, color, delay }: { title: string; value: string | number; trend?: string; icon: any; color: string; delay: string }) {
  const colors: any = {
    sky: "text-sky-400 bg-sky-50",
    indigo: "text-indigo-400 bg-indigo-50",
    cyan: "text-cyan-400 bg-cyan-50",
  };

  return (
    <div 
      className="glass-card p-6 animate-float" 
      style={{ animationDelay: delay }}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{title}</span>
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold font-display">{value}</span>
        {trend && (
          <span className={`text-[10px] font-bold ${trend.includes('%') ? 'text-green-500' : 'text-sky-500'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({ application, jobTitle }: any) {
  const statusColors: any = {
    rejected: "text-red-500 bg-red-50",
    accepted: "text-green-500 bg-green-50",
  };
  const status = application.status;
  const cardBorder = status === 'rejected' ? 'border-l-red-400' : status === 'accepted' ? 'border-l-green-400' : '';
  
  return (
    <Link href="/applicant/applications" className={`glass-card p-5 hover:translate-y-[-2px] transition-all flex items-center justify-between group border-l-4 ${cardBorder}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-on-surface group-hover:text-sky-600 transition-colors">{jobTitle}</h1>
          <h3 className="text-xs text-slate-400 uppercase font-bold tracking-tighter">Job ID: {application.jobId.slice(0, 8)}</h3>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Applied</p>
          <p className="text-xs font-bold text-slate-600">{new Date(application.appliedAt).toLocaleDateString()}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-all" />
      </div>
    </Link>
  );
}