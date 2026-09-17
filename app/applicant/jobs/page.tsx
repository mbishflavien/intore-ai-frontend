"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  Search, 
  ChevronRight, 
  Activity, 
  CheckCircle2, 
  Globe, 
  Target,
  Zap,
  Filter,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function JobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { jobs: jobList } = await api.jobs.list();
        setJobs(jobList);
      } catch (err) {
        console.error("Failed to fetch missions:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Jobs</h1>
          <p className="text-slate-500">Locate jobs aligned with your skills and experience.</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 bg-white/40 border border-white/60 px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-sm focus-within:ring-2 ring-sky-500/20 transition-all">
          <Search className="text-slate-400 w-5 h-5" />
          <input 
            className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full font-display text-on-surface placeholder:text-slate-400" 
            placeholder="Search missions by title, skill, or industry..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="px-6 py-3 bg-white/60 border border-white/80 rounded-2xl flex items-center gap-2 text-sm font-bold text-slate-600 hover:bg-white/80 transition-all">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <JobTile key={job.id} job={job} />
        ))}

        {filteredJobs.length === 0 && (
          <div className="col-span-full glass-card p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-300 mx-auto mb-6">
              <Sparkles className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-400">Discovery Lane Clear</h3>
            <p className="text-slate-400 mt-2">No missions currently detected for this query.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function JobTile({ job }: any) {
  // Simulated match score for demo purposes
  const matchScore = Math.floor(Math.random() * 30) + 70;

  return (
    <div className="glass-card p-6 flex flex-col hover:translate-y-[-4px] transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Target className="w-24 h-24" />
      </div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-sky-50 text-sky-600 border border-sky-100">
          Full-Time
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
          <Zap className="w-3 h-3 fill-indigo-600" /> {matchScore}% MATCH
        </div>
      </div>

      <div className="flex-1 space-y-2 mb-8 relative z-10">
        <h3 className="text-xl font-display font-black text-on-surface group-hover:text-sky-600 transition-colors leading-tight">
          {job.title}
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            <Globe className="w-3 h-3" /> {job.location || "Remote"}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            <Briefcase className="w-3 h-3" /> {job.educationLevel || "Bachelor"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-8 relative z-10">
        {job.requiredSkills.slice(0, 3).map((s: string, i: number) => (
          <span key={i} className="px-2 py-1 bg-white/60 border border-white/80 text-[10px] font-bold text-slate-500 rounded-lg">
            {s}
          </span>
        ))}
      </div>

      <div className="pt-6 border-t border-white/60 flex items-center justify-between relative z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Pool</span>
          <span className="text-xs font-bold text-on-surface">{job.candidateCount || 0} Candidates</span>
        </div>
        
        <Link 
          href={`/applicant/jobs/${job.id}`}
          className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-sky-100"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
