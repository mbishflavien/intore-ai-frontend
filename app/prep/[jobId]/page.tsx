"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Rocket,
  CheckCircle2,
  MapPin,
  Briefcase,
  GraduationCap,
  Target,
  Lightbulb,
  Star,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";

// Publicly accessible — no auth required.
// Candidates reach this via a shareable prep link shared by the recruiter.

const PREP_TIPS: string[] = [
  "Review the required skills listed below and be ready to give concrete examples for each.",
  "Prepare STAR-format answers (Situation, Task, Action, Result) for behavioural questions.",
  "Research the role's domain and be ready to discuss relevant trends.",
  "Have your experience timeline clear — dates, responsibilities, and outcomes.",
  "Prepare two or three questions to ask the interviewer about the role.",
];

export default function CandidatePrepPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { job: data } = await api.jobs.get(jobId);
        if (!data.prepMode) {
          setNotFound(true);
        } else {
          setJob(data);
        }
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [jobId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-aura-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen bg-aura-gradient flex items-center justify-center px-4">
        <div className="glass-card p-12 text-center max-w-md space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="font-display text-2xl font-black text-on-surface">Prep not available</h2>
          <p className="text-sm text-slate-500">
            This prep link is inactive or the role is no longer accepting candidates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aura-gradient py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-50/80 border border-sky-100 rounded-full text-[10px] font-bold text-sky-600 uppercase tracking-widest">
            <Rocket className="w-3.5 h-3.5" /> Candidate Prep
          </div>
          <h1 className="font-display text-4xl font-black text-on-surface tracking-tight">
            {job.title}
          </h1>
          <div className="flex flex-wrap justify-center gap-4 text-slate-400 text-sm font-medium">
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {job.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" /> {job.minimumYearsExperience}+ years experience
            </span>
            {job.educationLevel && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> {job.educationLevel}
              </span>
            )}
          </div>
        </div>

        {/* Role summary */}
        <div className="glass-card p-8 space-y-3">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            About the Role
          </h2>
          <p className="text-slate-600 leading-relaxed">{job.summary}</p>
        </div>

        {/* Required skills */}
        <div className="glass-card p-8 space-y-5">
          <h2 className="text-[10px] font-bold text-sky-600 uppercase tracking-widest flex items-center gap-2">
            <Star className="w-3.5 h-3.5" /> Required Skills
          </h2>
          <p className="text-sm text-slate-500">
            The AI screening model evaluates candidates on these skills. Make sure your answers
            demonstrate clear hands-on experience for each one.
          </p>
          <div className="flex flex-wrap gap-2">
            {job.requiredSkills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-100 text-sky-700 rounded-xl text-sm font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {skill}
              </span>
            ))}
          </div>

          {job.preferredSkills.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Nice to have
              </p>
              <div className="flex flex-wrap gap-2">
                {job.preferredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl text-sm font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* What the AI evaluates */}
        <div className="glass-card p-8 space-y-5">
          <h2 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> What the AI Evaluates
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(["Skills", "Experience", "Education", "Relevance"] as const).map((dim) => (
              <div
                key={dim}
                className="bg-white/40 border border-white/60 rounded-2xl p-4 text-center space-y-1"
              >
                <div className="text-xs font-black text-indigo-600">{dim}</div>
                <div className="text-[10px] text-slate-400">Scored 0–100</div>
              </div>
            ))}
          </div>
          {job.proofHire?.enabled && (
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-700 font-medium">
              This role includes a <span className="font-black">ProofHire challenge</span> — a
              hands-on technical assessment that adds a fifth score dimension. Completing it
              strengthens your overall fit score.
            </div>
          )}
        </div>

        {/* Prep tips */}
        <div className="glass-card p-8 space-y-5">
          <h2 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5" /> Prep Tips
          </h2>
          <ul className="space-y-3">
            {PREP_TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          This prep guide is provided by the recruiter via IntoreAI. Good luck.
        </p>
      </div>
    </div>
  );
}
