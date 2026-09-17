"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Award, 
  Globe, 
  Mail, 
  MoreHorizontal,
  ChevronRight,
  Zap,
  LayoutGrid,
  List
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function TalentPoolPage() {
  const { token, user } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!token || user?.role !== "recruiter") {
      setIsLoading(false);
      return;
    }

    const fetchTalent = async () => {
      try {
        // We'll aggregate talent from all missions
        const { jobs } = await api.jobs.listByRecruiter(token);
        const allAppsPromises = jobs.map(j => api.jobs.getApplications(j.id, token));
        const allAppsResults = await Promise.all(allAppsPromises);
        
        const uniqueTalent = new Map();
        allAppsResults.forEach(res => {
          res.applications.forEach((app: any) => {
            if (!uniqueTalent.has(app.applicantId)) {
              uniqueTalent.set(app.applicantId, app);
            }
          });
        });

        setCandidates(Array.from(uniqueTalent.values()));
      } catch (err) {
        console.error("Failed to fetch talent pool:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTalent();
  }, [token, user?.role]);

  const filteredCandidates = candidates.filter(c => 
    `${c.profile.firstName} ${c.profile.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.profile.headline.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Talent Pool</h1>
          <p className="text-slate-500">Global directory of all candidates.</p>
        </div>

        <div className="flex bg-white/40 backdrop-blur-xl p-1 rounded-2xl border border-white/60 shadow-sm">
          <button className="p-2 rounded-xl bg-white text-sky-600 shadow-sm"><LayoutGrid className="w-5 h-5" /></button>
          <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600"><List className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 bg-white/40 border border-white/60 px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-sm focus-within:ring-2 ring-sky-500/20 transition-all">
          <Search className="text-slate-400 w-5 h-5" />
          <input 
            className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full font-display text-on-surface placeholder:text-slate-400" 
            placeholder="Search talent by name, skill, or headline..." 
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
        {filteredCandidates.map((c) => (
          <TalentCard key={c.id} candidate={c} />
        ))}

        {filteredCandidates.length === 0 && (
          <div className="col-span-full glass-card p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-300 mx-auto mb-6">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-400">Talent Pool Empty</h3>
            <p className="text-slate-400 mt-2">Upload resumes to begin finding candidates.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TalentCard({ candidate }: any) {
  const p = candidate.profile;
  return (
    <div className="glass-card p-6 flex flex-col hover:translate-y-[-4px] transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-sky-100">
          {p.firstName[0]}{p.lastName[0]}
        </div>
        <button className="p-1 text-slate-300 hover:text-slate-600 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 space-y-1 mb-6">
        <h3 className="text-xl font-display font-black text-on-surface group-hover:text-sky-600 transition-colors leading-tight">
          {p.firstName} {p.lastName}
        </h3>
        <p className="text-xs text-sky-600 font-semibold">{p.headline}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            <Globe className="w-3 h-3" /> {p.location}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            <Award className="w-3 h-3" /> Proof {candidate.proofScore ?? 0}%
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {p.skills.slice(0, 3).map((s: any, i: number) => (
          <span key={i} className="px-2 py-1 bg-white/60 border border-white/80 text-[10px] font-bold text-slate-500 rounded-lg">
            {s.name}
          </span>
        ))}
        {p.skills.length > 3 && <span className="text-[10px] font-bold text-slate-400 ml-1">+{p.skills.length - 3}</span>}
      </div>

      <div className="pt-4 border-t border-white/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Application</span>
        </div>
        <button className="p-2 bg-sky-50 text-sky-500 rounded-xl hover:bg-sky-500 hover:text-white transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
