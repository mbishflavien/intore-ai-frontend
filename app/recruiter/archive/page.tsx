"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FolderHeart, 
  Search, 
  History, 
  ShieldCheck, 
  Zap,
  ArrowLeft,
  ChevronRight,
  Database,
  Lock,
  Clock,
  Users,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface Job {
  id: string;
  title: string;
  status: string;
  requiredSkills: string[];
  createdAt: string;
  closedAt?: string;
  updatedAt: string;
}

export default function ArchivePage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [closedJobs, setClosedJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== "recruiter") {
      setIsLoading(false);
      return;
    }

    const fetchJobs = async () => {
      try {
        const { jobs: jobList } = await api.jobs.listByRecruiter(token);
        setAllJobs(jobList);
        setClosedJobs(jobList.filter((j: Job) => j.status === "closed"));
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [token, user?.role]);

  const totalCandidates = allJobs.filter(j => j.status === "closed").length * 8; // placeholder calc
  const candidatesWithOutcome = Math.round(totalCandidates * 0.85); // 85% have outcomes
  const storageEfficiency = totalCandidates > 0 ? Math.round((candidatesWithOutcome / totalCandidates) * 100) : 0;

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
          <Link href="/recruiter" className="p-2 hover:bg-white/40 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </Link>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Archive</h1>
            <p className="text-slate-500">History of closed job postings.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {closedJobs.length === 0 ? (
            <div className="glass-card p-20 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200">
                <History className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-400">Archive Empty</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm">
                No concluded job postings yet. Closed jobs will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="font-display text-xl font-bold text-slate-700">Closed Job Postings</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{closedJobs.length} Jobs</span>
              </div>
              {closedJobs.map((job) => (
                <div 
                  key={job.id} 
                  onClick={() => router.push(`/recruiter/jobs/${job.id}`)}
                  className="glass-card p-6 hover:translate-y-[-2px] transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 overflow-hidden">
                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest flex-shrink-0 whitespace-nowrap">
                          Concluded
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          Closed: {job.closedAt ? new Date(job.closedAt).toLocaleDateString() : new Date(job.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-display font-bold text-on-surface group-hover:text-sky-600 transition-colors mb-2">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Users className="w-3 h-3" /> 8 Candidates
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" /> 3 Hired
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Clock className="w-3 h-3" /> 5 Not Selected
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link 
                        href={`/recruiter/jobs/${job.id}/applicants`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-500 hover:text-white transition-all text-sm font-semibold"
                      >
                        View Candidates
                      </Link>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-500 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4 bg-gradient-to-br from-white/60 to-indigo-50/30">
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
              <Database className="w-4 h-4" /> Vault Statistics
            </div>
            <div className="space-y-4">
              <StatRow label="Closed Jobs" value={closedJobs.length} />
              <StatRow label="Total Candidates" value={totalCandidates} />
              <StatRow label="Storage Efficiency" value={`${storageEfficiency}%`} />
            </div>
          </div>

          {/* 
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-sky-500 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" /> Security
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tight">
              All archived data is encrypted using IntoreAI high-performance talent encryption. Access is restricted to Administrators.
            </p>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest">
              <Zap className="w-4 h-4" /> Quick Stats
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Average time open</span>
                <span className="text-sm font-bold text-on-surface">14 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Avg. candidates per job</span>
                <span className="text-sm font-bold text-on-surface">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Success rate</span>
                <span className="text-sm font-bold text-green-500">37%</span>
              </div>
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm font-black text-on-surface font-display">{value}</span>
    </div>
  );
}