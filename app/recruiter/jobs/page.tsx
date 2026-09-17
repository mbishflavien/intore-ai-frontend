"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  Search, 
  Plus, 
  ChevronRight, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreHorizontal,
  Target
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface Job {
  id: string;
  title: string;
  status: string;
  requiredSkills: string[];
  createdAt: string;
}

export default function JobsPage() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    if (!token || user?.role !== "recruiter") {
      setIsLoading(false);
      return;
    }

    const fetchJobs = async () => {
      try {
        const { jobs: jobList } = await api.jobs.listByRecruiter(token);
        setJobs(jobList);
      } catch (err) {
        console.error("Failed to fetch missions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [token, user?.role]);

  const statusMap: Record<string, string> = {
    "Active": "published",
    "Draft": "draft",
    "Closed": "closed",
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedFilter === "All" || job.status === statusMap[selectedFilter])
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
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Jobs</h1>
          <p className="text-slate-500">Orchestrate and monitor your active talent pipelines.</p>
        </div>

        <Link 
          href="/recruiter/jobs/new"
          className="px-8 py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-[24px] font-bold shadow-lg shadow-sky-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create Job
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 bg-white/40 border border-white/60 px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-sm focus-within:ring-2 ring-sky-500/20 transition-all">
          <Search className="text-slate-400 w-5 h-5" />
          <input 
            className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full font-display text-on-surface placeholder:text-slate-400" 
            placeholder="Search jobs by title or skill..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex bg-white/40 backdrop-blur-xl p-1 rounded-2xl border border-white/60 shadow-sm">
          {["All", "Active", "Draft", "Closed"].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setSelectedFilter(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${selectedFilter === tab ? "bg-white text-sky-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <JobTile key={job.id} job={job} />
        ))}
        
        {filteredJobs.length === 0 && (
          <div className="col-span-full glass-card p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-300 mx-auto mb-6">
              <Briefcase className="w-10 h-10" />
            </div>
<h3 className="text-xl font-bold text-slate-400">No jobs found.</h3>
              <p className="text-slate-400 mt-2">Adjust your filters or create a new job posting.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function JobTile({ job }: { job: Job }) {
  const router = useRouter();
  const statusStyles: any = {
    published: { color: "text-green-500 bg-green-50", icon: CheckCircle2, label: "Active" },
    draft: { color: "text-sky-500 bg-sky-50", icon: Clock, label: "Drafting" },
    closed: { color: "text-slate-400 bg-slate-50", icon: AlertCircle, label: "Concluded" },
  };

  const status = statusStyles[job.status] || statusStyles.draft;

  return (
    <div 
      onClick={() => router.push(`/recruiter/jobs/${job.id}`)}
      className="glass-card p-6 flex flex-col h-full hover:translate-y-[-4px] transition-all group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex-shrink-0 whitespace-nowrap ${status.color}`}>
          <status.icon className="w-3 h-3" /> {status.label}
        </div>
        <button className="p-1 text-slate-300 hover:text-slate-600 transition-colors flex-shrink-0">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <h3 className="text-xl font-display font-black text-on-surface group-hover:text-sky-600 transition-colors leading-tight">
            {job.title}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Initialized: {new Date(job.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {job.requiredSkills.slice(0, 3).map((skill, i) => (
            <span key={i} className="px-2 py-1 bg-white/60 border border-white/80 text-[10px] font-bold text-slate-500 rounded-lg">
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 3 && (
            <span className="px-2 py-1 text-[10px] font-bold text-slate-400">
              +{job.requiredSkills.length - 3} More
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 shadow-sm" />
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">12 Candidates</span>
        </div>
        
        <Link 
          href={`/recruiter/jobs/${job.id}/applicants`}
          onClick={(e) => e.stopPropagation()}
          className="p-2 bg-sky-50 text-sky-500 rounded-xl hover:bg-sky-500 hover:text-white transition-all shadow-sm shadow-sky-100"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
