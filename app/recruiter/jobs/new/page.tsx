"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Dna, 
  Target, 
  AlertCircle, 
  Save, 
  Zap,
  ArrowLeft,
  Briefcase,
  MapPin,
  GraduationCap,
  Award
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type JobFormState = {
  title: string;
  summary: string;
  requiredSkills: string;
  preferredSkills: string;
  dealbreakers: string;
  minimumYearsExperience: number;
  educationLevel: string;
  location: string;
  anonymizeCandidates: boolean;
  proofHire: {
    enabled: boolean;
    mode: "required" | "optional";
    challengeId: string;
  };
  weights: {
    skills: number;
    experience: number;
    education: number;
    relevance: number;
    proof: number;
  };
};

const defaultJob: JobFormState = {
  title: "",
  summary: "",
  requiredSkills: "",
  preferredSkills: "",
  dealbreakers: "",
  minimumYearsExperience: 2,
  educationLevel: "Bachelor",
  location: "Remote",
  anonymizeCandidates: false,
  proofHire: {
    enabled: false,
    mode: "optional",
    challengeId: "",
  },
  weights: {
    skills: 40,
    experience: 20,
    education: 10,
    relevance: 10,
    proof: 20,
  },
};

export default function NewJobPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [job, setJob] = useState<JobFormState>(defaultJob);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challenges, setChallenges] = useState<any[]>([]);
  const visibleTotalWeight =
    job.weights.skills + job.weights.experience + job.weights.education + job.weights.relevance;

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!token) return;
      try {
        const { challenges: data } = await api.proofhire.listChallenges(token);
        setChallenges(data);
      } catch (err) {
        console.error("Failed to fetch challenges:", err);
      }
    };
    fetchChallenges();
  }, [token]);

  async function handleSubmit(e: React.FormEvent, saveAsDraft: boolean = false) {
    e.preventDefault();
    if (!token) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        ...job,
        requiredSkills: job.requiredSkills.split(",").map(s => s.trim()).filter(Boolean),
        preferredSkills: job.preferredSkills.split(",").map(s => s.trim()).filter(Boolean),
        dealbreakers: job.dealbreakers.split(",").map(s => s.trim()).filter(Boolean),
        screeningWeights: job.weights,
        proofHire: job.proofHire.enabled ? job.proofHire : undefined,
        status: saveAsDraft ? "draft" : "published"
      };

      await api.jobs.create(payload as any, token);
      
      if (saveAsDraft) {
        alert("Job saved as draft!");
      } else {
        router.push("/recruiter");
      }
    } catch (err) {
      console.error("Failed to create job:", err);
      alert(saveAsDraft ? "Failed to save job as draft." : "Failed to create job.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveDraft(e: React.FormEvent) {
    await handleSubmit(e, true);
  }

  function handleWeightChange(weightKey: keyof JobFormState["weights"], nextValue: number) {
    const currentValue = job.weights[weightKey];
    const delta = nextValue - currentValue;
    const nextTotal = visibleTotalWeight + delta;

    if (delta > 0 && nextTotal > 100) {
      return;
    }

    setJob({
      ...job,
      weights: {
        ...job.weights,
        [weightKey]: nextValue,
      },
    });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-white/40 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-400" />
        </button>
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Post New Position</h1>
          <p className="text-slate-500">Define the requirements for your next hire.</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2 text-sky-500 font-bold uppercase text-[10px] tracking-widest">
              <Briefcase className="w-4 h-4" /> Role Details
            </div>
            
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1">Role Title</span>
                <input 
                  required
                  value={job.title}
                  onChange={e => setJob({...job, title: e.target.value})}
                  placeholder="e.g. Senior AI Engineer"
                  className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 focus:ring-2 ring-sky-500/20 outline-none transition-all"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1">Job Summary</span>
                <textarea 
                  required
                  rows={4}
                  value={job.summary}
                  onChange={e => setJob({...job, summary: e.target.value})}
                  placeholder="Describe the impact this role will have..."
                  className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 focus:ring-2 ring-sky-500/20 outline-none transition-all resize-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location
                  </span>
                  <input 
                    value={job.location}
                    onChange={e => setJob({...job, location: e.target.value})}
                    className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 focus:ring-2 ring-sky-500/20 outline-none transition-all"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Education
                  </span>
                  <input 
                    value={job.educationLevel}
                    onChange={e => setJob({...job, educationLevel: e.target.value})}
                    className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 focus:ring-2 ring-sky-500/20 outline-none transition-all"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1 flex items-center gap-1">
                  <Award className="w-4 h-4" /> Minimum Years of Experience
                </span>
                <input 
                  type="number"
                  min="0"
                  value={job.minimumYearsExperience}
                  onChange={e => setJob({...job, minimumYearsExperience: parseInt(e.target.value) || 0})}
                  className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 focus:ring-2 ring-sky-500/20 outline-none transition-all"
                />
              </label>
            </div>
          </div>

          <div className="glass-card p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2 text-indigo-500 font-bold uppercase text-[10px] tracking-widest">
              <Dna className="w-4 h-4" /> Required Skills
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1">Required Skills (Comma separated)</span>
                <input 
                  value={job.requiredSkills}
                  onChange={e => setJob({...job, requiredSkills: e.target.value})}
                  placeholder="TypeScript, Next.js, Node.js..."
                  className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1">Preferred Skills</span>
                <input 
                  value={job.preferredSkills}
                  onChange={e => setJob({...job, preferredSkills: e.target.value})}
                  className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                />
              </label>
            </div>
          </div>

          <div className="glass-card p-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-500 font-bold uppercase text-[10px] tracking-widest">
                <Target className="w-4 h-4" /> Skills Assessment
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={job.proofHire.enabled}
                  onChange={e => setJob({...job, proofHire: {...job.proofHire, enabled: e.target.checked}})}
                  className="w-4 h-4 rounded border-white/60 text-cyan-500 focus:ring-cyan-500/20"
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enable</span>
              </label>
            </div>

            {job.proofHire.enabled && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1">Select Challenge</span>
                  <select
                    value={job.proofHire.challengeId}
                    onChange={e => setJob({...job, proofHire: {...job.proofHire, challengeId: e.target.value}})}
                    className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 focus:ring-2 ring-cyan-500/20 outline-none transition-all appearance-none"
                  >
                    <option value="">Select a challenge...</option>
                    {challenges.map(c => (
                      <option key={c.id} value={c.id}>{c.title} ({c.type})</option>
                    ))}
                  </select>
                </label>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio"
                      checked={job.proofHire.mode === "required"}
                      onChange={() => setJob({...job, proofHire: {...job.proofHire, mode: "required"}})}
                      className="w-4 h-4 border-white/60 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <span className="text-sm font-medium text-slate-600">Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio"
                      checked={job.proofHire.mode === "optional"}
                      onChange={() => setJob({...job, proofHire: {...job.proofHire, mode: "optional"}})}
                      className="w-4 h-4 border-white/60 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <span className="text-sm font-medium text-slate-600">Optional</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card p-8 bg-red-50/20 border-red-100/50">
            <div className="flex items-center gap-2 mb-4 text-red-500 font-bold uppercase text-[10px] tracking-widest">
              <AlertCircle className="w-4 h-4" /> Dealbreakers
            </div>
            <textarea 
              value={job.dealbreakers}
              onChange={e => setJob({...job, dealbreakers: e.target.value})}
              placeholder="e.g. no visa sponsorship, must be based in GMT+2..."
              className="w-full bg-white/50 border border-red-100/60 rounded-2xl px-4 py-3 focus:ring-2 ring-red-500/20 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Sidebar Configuration Area */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-500 font-bold uppercase text-[10px] tracking-widest">
                <Target className="w-4 h-4" /> Scoring Criteria
              </div>
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Total: {visibleTotalWeight}%
              </span>
            </div>

            <div className="space-y-6">
              <WeightSlider 
                label="Technical Skills" 
                value={job.weights.skills} 
                onChange={(v: number) => handleWeightChange("skills", v)} 
                color="sky"
              />
              <WeightSlider 
                label="Experience" 
                value={job.weights.experience} 
                onChange={(v: number) => handleWeightChange("experience", v)} 
                color="indigo"
              />
              <WeightSlider 
                label="Education" 
                value={job.weights.education} 
                onChange={(v: number) => handleWeightChange("education", v)} 
                color="cyan"
              />
              <WeightSlider 
                label="Professional Fit" 
                value={job.weights.relevance} 
                onChange={(v: number) => handleWeightChange("relevance", v)} 
                color="violet"
              />
            </div>

            <div className="pt-4 border-t border-white/60">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={job.anonymizeCandidates}
                  onChange={e => setJob({...job, anonymizeCandidates: e.target.checked})}
                  className="w-5 h-5 rounded-lg border-white/60 text-sky-500 focus:ring-sky-500/20"
                />
                <span className="text-sm font-medium text-slate-600 group-hover:text-sky-600 transition-colors">
                  Anonymize candidate names
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-[24px] font-bold shadow-lg shadow-sky-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-5 h-5" /> {isSubmitting ? "Posting..." : "Post Position"}
            </button>
            <button 
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="w-full py-4 bg-white/60 border border-white text-slate-600 rounded-[24px] font-bold hover:bg-white/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" /> Save as Draft
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function WeightSlider({ label, value, onChange, color }: any) {
  const barColors: any = {
    sky: "bg-sky-400",
    indigo: "bg-indigo-400",
    cyan: "bg-cyan-400",
    violet: "bg-violet-400",
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
        <span>{label}</span>
        <span className="text-on-surface font-display">{value}%</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full h-1.5 appearance-none rounded-full cursor-pointer bg-slate-100/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-sky-400 [&::-webkit-slider-thumb]:shadow-md`}
      />
    </div>
  );
}
