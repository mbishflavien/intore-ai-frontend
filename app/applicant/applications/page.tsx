"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Layers, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Activity, 
  ArrowLeft,
  Search,
  ExternalLink,
  Target
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function ApplicationsPage() {
  const { token } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchApps = async () => {
      try {
        const { applications: appList } = await api.applications.list(token);
        setApplications(appList);
      } catch (err) {
        console.error("Failed to fetch application journeys:", err);
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
        setJobs(jobList);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      }
    };
    fetchJobs();
  }, []);

  const getJobTitle = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    return job?.title || `Job ${jobId.slice(0, 8)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/applicant" className="p-2 hover:bg-white/40 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </Link>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">My Applications</h1>
            <p className="text-slate-500">Track your job applications.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Journey List */}
        <div className="lg:col-span-2 space-y-6">
          {applications.map((app) => (
            <JourneyCard key={app.id} application={app} jobTitle={getJobTitle(app.jobId)} />
          ))}
          
          {applications.length === 0 && (
            <div className="glass-card p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 mx-auto mb-6">
                <Layers className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-400">No Applications</h3>
              <p className="text-slate-400 mt-2">Start by applying to jobs.</p>
              <Link href="/applicant/jobs" className="mt-8 inline-flex px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-sky-100 hover:bg-primary/90 transition-all">
                Enter Discovery Lane
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* 
          <div className="glass-card p-6 bg-gradient-to-br from-white/60 to-sky-50/30">
            <div className="flex items-center gap-2 text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-4">
              <Activity className="w-4 h-4" /> Live Intel Feed
            </div>
            <div className="space-y-6 relative">
              <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-sky-100" />
              <IntelItem time="2 mins ago" text="Recruiter viewed your profile for System Architect position." />
              <IntelItem time="1 hour ago" text="AI screening successfully matched your profile to Lumina Systems." />
              <IntelItem time="Yesterday" text="New mission detected in your preferred technical sector." />
            </div>
          </div>

          <div className="glass-card p-6 border-indigo-100 bg-indigo-50/20">
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">
              <Target className="w-4 h-4" /> Optimization Tip
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Applicants who complete the **Talent Assessment** within 24 hours of initialization have a **15% higher success rate**.
            </p>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}

function JourneyCard({ application, jobTitle }: any) {
  const status = application.status;
  const statusColor = status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-white border-slate-100 text-slate-600';
  
  return (
    <div className="glass-card p-8 hover:border-sky-200 transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-2xl font-display font-black text-on-surface group-hover:text-sky-600 transition-colors">
            {jobTitle}
          </h1>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
            Job ID: {application.jobId.slice(0, 8)} <span className="w-1 h-1 bg-slate-300 rounded-full" /> Applied: {new Date(application.appliedAt).toLocaleDateString()} <span className="w-1 h-1 bg-slate-300 rounded-full" /> Full-Time
          </h3>
        </div>
        <div className={`px-4 py-1.5 rounded-full border shadow-sm text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
          {status.replace('_', ' ')}
        </div>
      </div>

      {/* Progress Journey Line */}
      <div className="relative flex justify-between items-center px-4 mb-8">
        <div className="absolute left-8 right-8 h-[2px] bg-slate-100 z-0" />
        <StatusNode label="Submitted" active={true} completed={true} finalStatus={status} />
        <StatusNode label="HR Review" active={status !== 'submitted'} completed={['shortlisted', 'accepted', 'rejected'].includes(status)} finalStatus={status} />
        <StatusNode label="Interview" active={['accepted', 'rejected'].includes(status)} completed={['accepted', 'rejected'].includes(status)} finalStatus={status} />
        <StatusNode label="Selection" active={status === 'accepted'} completed={status === 'accepted'} finalStatus={status} />
      </div>

      <div className="mt-8 pt-6 border-t border-white/60 flex justify-between items-center">
        <div className="flex gap-4">
          {application.proofScore ? (
            <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4" /> Assessment Score: {application.proofScore}%
            </div>
          ) : (
            <button className="flex items-center gap-2 text-[10px] font-bold text-sky-500 uppercase tracking-widest hover:underline">
              <ExternalLink className="w-4 h-4" /> Start Assessment
            </button>
          )}
        </div>
        
        <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-sky-50 hover:text-sky-500 transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function StatusNode({ label, active, completed, finalStatus }: any) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-2">
      <div className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${
        completed ? (
          finalStatus === 'accepted' ? 'bg-green-500 border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
          finalStatus === 'rejected' ? 'bg-red-500 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
          'bg-green-500 border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
        ) :
        active ? 'bg-sky-500 border-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]' :
        'bg-white border-slate-200'
      }`} />
      <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'text-on-surface' : 'text-slate-300'}`}>{label}</span>
    </div>
  );
}

function IntelItem({ time, text }: any) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-0 top-[3px] w-4 h-4 rounded-full bg-white border-2 border-sky-100 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{time}</p>
      <p className="text-xs text-slate-600 font-medium leading-relaxed">{text}</p>
    </div>
  );
}
