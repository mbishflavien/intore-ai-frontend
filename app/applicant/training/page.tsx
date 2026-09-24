"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ChevronRight,
  Clock,
  Star,
  Sparkles,
  Bot,
  CirclePlay,
  MapPin,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { PracticeChallengeLite, TrainingModule, TrainingProgress, TrainingRecommendation } from "@/lib/types";

function levelColor(level: string): string {
  if (level === "beginner") return "bg-emerald-50 text-emerald-600";
  if (level === "advanced") return "bg-rose-50 text-rose-600";
  return "bg-amber-50 text-amber-600";
}

export default function TrainingPage() {
  const { token } = useAuth();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([]);
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [practiceChallenges, setPracticeChallenges] = useState<PracticeChallengeLite[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [catalogRes] = await Promise.all([api.training.listModules()]);
        setModules(catalogRes.modules);
      } catch (error) {
        console.error("Failed to load training catalog:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchPrivate = async () => {
      try {
        const [progressRes, recRes, practiceRes] = await Promise.all([
          api.training.getProgress(token),
          api.training.getRecommendations(token),
          api.training.listPracticeChallenges(token),
        ]);
        setProgress(progressRes.progress);
        setRecommendations(recRes.recommendations);
        setPracticeChallenges(practiceRes.challenges);
      } catch (error) {
        console.error("Failed to load private training data:", error);
      }
    };
    fetchPrivate();
  }, [token]);

  const moduleProgress = useMemo(() => {
    const map = new Map<string, TrainingProgress>();
    progress.forEach((entry) => map.set(entry.moduleId, entry));
    return map;
  }, [progress]);

  const filteredModules = useMemo(
    () =>
      modules.filter((module) => {
        if (!filter) return true;
        const haystack = `${module.skill} ${module.title} ${module.tags.join(" ")}`.toLowerCase();
        return haystack.includes(filter.toLowerCase());
      }),
    [modules, filter],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="glass-card p-16 text-center space-y-4">
        <GraduationCap className="w-12 h-12 text-sky-500 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-on-surface">Sign in to start learning</h2>
        <p className="text-slate-500">Track lessons, get skill-gap recommendations, and train with the AI mentor.</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-full font-semibold shadow-lg shadow-sky-200 hover:scale-105 transition-all">
          Sign In <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const totalUnits = (module: TrainingModule) => module.units.length;

  return (
    <div className="space-y-12">
      <section className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-200">
            <GraduationCap className="w-6 h-6" />
          </span>
          <h1 className="font-display text-4xl font-bold text-on-surface tracking-tight">Upskill</h1>
        </div>
        <p className="text-slate-500">Close your skill gaps, learn the in-demand stack, and train with the AI mentor.</p>
      </section>

      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold text-on-surface flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500" /> Recommended for your profile
            </h2>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-full">
              Skill-gap driven
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.skill} className="glass-card p-5 border-l-4 border-l-sky-400">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-1">Missing skill</p>
                    <h3 className="font-bold text-on-surface capitalize">{rec.skill}</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-5">{rec.reason}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {rec.jobTitles.slice(0, 2).map((title) => (
                        <span key={title} className="bg-white/60 border border-white/60 rounded-full px-2 py-0.5">{title}</span>
                      ))}
                      {rec.jobTitles.length > 2 && <span>+{rec.jobTitles.length - 2} more</span>}
                    </div>
                  </div>
                  {rec.module ? (
                    <Link href={`/applicant/training/${rec.module.id}`} className="shrink-0 inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-full text-sm font-semibold shadow-lg shadow-sky-200 hover:scale-105 transition-all">
                      Start <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className="shrink-0 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold">Lesson soon</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-on-surface">Learning Library</h2>
            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest bg-sky-50 px-2 py-1 rounded-full">
              {modules.length} tracks
            </span>
          </div>
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter by skill or tag..."
            className="bg-white/60 border border-white/60 rounded-2xl px-4 py-2.5 w-64 focus:ring-4 ring-sky-500/10 outline-none placeholder:text-slate-300 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map((module) => {
            const entry = moduleProgress.get(module.id);
            const completed = entry?.completedUnitIds.length ?? 0;
            const total = totalUnits(module);
            const percent = Math.round((completed / total) * 100);
            const isDone = percent === 100;

            return (
              <Link
                key={module.id}
                href={`/applicant/training/${module.id}`}
                className="glass-card p-6 hover:border-sky-200 transition-all hover:-translate-y-1 group flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${levelColor(module.level)}`}>
                    {module.level}
                  </span>
                  {isDone ? (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Completed</span>
                  ) : (
                    completed > 0 ? (
                      <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-1 rounded-full">{percent}%</span>
                    ) : null
                  )}
                </div>
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">{module.skill}</p>
                  <h3 className="font-display text-lg font-bold text-on-surface leading-snug group-hover:text-sky-600 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-5">{module.subtitle}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-auto pt-4">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {total} units</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {module.estimatedMinutes}m</span>
                </div>
                <div className="mt-4">
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {practiceChallenges.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold text-on-surface flex items-center gap-2">
              <CirclePlay className="w-5 h-5 text-emerald-500" /> Practice Zone
            </h2>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full">
              No records, instant feedback
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {practiceChallenges.map((challenge) => (
              <Link
                key={challenge.challengeId}
                href={`/applicant/training/practice/${challenge.challengeId}`}
                className="glass-card p-5 hover:border-emerald-200 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                    <CirclePlay className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </span>
                  <div>
                    <h3 className="font-bold text-on-surface text-sm">{challenge.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                      <span className="uppercase tracking-wider bg-slate-100 rounded-full px-2 py-0.5">{challenge.type}</span>
                      <span className="truncate max-w-48">for {challenge.jobTitle}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: Bot, title: "AI Mentor", desc: "Get quizzed live and coached topic-by-topic on any skill.", href: "/applicant/mentor", color: "from-sky-400 to-indigo-500" },
          { icon: Lightbulb, title: "Skill-gap reporting", desc: "Match the exact skills local and remote employers are hiring for.", href: "/applicant/jobs", color: "from-amber-400 to-orange-500" },
          { icon: TrendingUp, title: "Track your growth", desc: "Every unit you finish builds your profile score credibility.", href: "/applicant/training", color: "from-emerald-400 to-teal-500" },
        ].map((card) => (
          <Link key={card.title} href={card.href} className="glass-card p-6 hover:-translate-y-1 transition-all group">
            <span className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${card.color} text-white shadow-lg mb-4`}>
              <card.icon className="w-5 h-5" />
            </span>
            <h3 className="font-display font-bold text-on-surface mb-1 flex items-center gap-2">
              {card.title} <Star className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-400" />
            </h3>
            <p className="text-xs text-slate-500 leading-5">{card.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}