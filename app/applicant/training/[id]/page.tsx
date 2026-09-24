"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { TrainingModule, TrainingProgress } from "@/lib/types";

function levelColor(level: string): string {
  if (level === "beginner") return "bg-emerald-50 text-emerald-600";
  if (level === "advanced") return "bg-rose-50 text-rose-600";
  return "bg-amber-50 text-amber-600";
}

export default function ModuleDetailPage() {
  const params = useParams();
  const moduleId = (params.id as string) ?? "";
  const { token } = useAuth();
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [checked, setChecked] = useState<Record<string, Record<string, boolean>>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const { module: data } = await api.training.getModule(moduleId);
        setModule(data);
        setExpandedUnit(data.units[0]?.id ?? null);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load module");
      } finally {
        setIsLoading(false);
      }
    };
    fetchModule();
  }, [moduleId]);

  useEffect(() => {
    if (!token) return;
    api.training
      .getProgress(token)
      .then(({ progress: list }) => setProgress(list))
      .catch(() => undefined);
  }, [token]);

  const entry = useMemo(() => progress.find((item) => item.moduleId === module?.id), [progress, module]);
  const completedIds = new Set(entry?.completedUnitIds ?? []);
  const completedCount = module?.units.filter((unit) => completedIds.has(unit.id)).length ?? 0;
  const totalUnits = module?.units.length ?? 0;
  const percent = totalUnits === 0 ? 0 : Math.round((completedCount / totalUnits) * 100);
  const isDone = percent === 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-slate-500 mb-4">{message || "Module not found."}</p>
        <Link href="/applicant/training" className="text-sky-500 font-semibold hover:underline">← Back to Learning Hub</Link>
      </div>
    );
  }

  const toggleUnit = (unitId: string) => {
    setExpandedUnit((current) => (current === unitId ? null : unitId));
  };

  const toggleChecklistItem = (unitId: string, checklistIndex: number) => {
    setChecked((current) => ({
      ...current,
      [unitId]: { ...(current[unitId] ?? {}), [checklistIndex]: !(current[unitId]?.[checklistIndex] ?? false) },
    }));
  };

  const selectAnswer = (unitId: string, optionIndex: number, quiz: NonNullable<TrainingModule["units"][number]["quiz"]>) => {
    setAnswers((current) => {
      const next = { ...current, [unitId]: optionIndex };
      if (optionIndex === quiz.answerIndex) {
        return next;
      }
      return next;
    });
  };

  const markComplete = async (unitId: string) => {
    if (!token) {
      setMessage("Sign in to track your progress.");
      return;
    }
    if (completedIds.has(unitId)) return;
    try {
      const { progress: list } = await api.training.markUnitComplete(module.id, unitId, token);
      setProgress(list);
      setMessage("Unit marked complete. Keep going!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update progress");
    }
  };

  return (
    <div className="space-y-8">
      <Link href="/applicant/training" className="inline-flex items-center gap-2 text-sky-500 text-sm font-semibold hover:underline">
        <ArrowLeft className="w-4 h-4" /> Learning Hub
      </Link>

      <section className="glass-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${levelColor(module.level)}`}>
                {module.level}
              </span>
              <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">{module.skill}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~{module.estimatedMinutes} min
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold text-on-surface mb-1">{module.title}</h1>
            <p className="text-slate-500 text-sm">{module.subtitle}</p>
            <p className="text-sm text-slate-600 mt-4 leading-6">{module.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {module.relatedSkills.slice(0, 6).map((skill) => (
                <span key={skill} className="bg-white/70 border border-white/60 rounded-full px-3 py-1 text-xs font-semibold text-slate-500">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="text-center shrink-0">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(percent / 100) * 276.5} 276.5`}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-xl font-black text-on-surface">{percent}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">done</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{completedCount}/{totalUnits} units</p>
            {isDone && <p className="text-[10px] font-black text-emerald-600 mt-1">Track completed 🎉</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href={`/applicant/mentor?skill=${encodeURIComponent(module.skill)}`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-full font-semibold shadow-lg shadow-sky-200 hover:scale-105 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Train with the AI Mentor
          </Link>
          <a
            href="#resources"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white/60 border border-white/70 text-slate-600 rounded-full font-semibold hover:bg-white transition-all"
          >
            <BookOpen className="w-4 h-4" /> External resources
          </a>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold text-on-surface">Lessons</h2>
          {message && <p className="text-sm font-semibold text-sky-600">{message}</p>}
        </div>
        <div className="space-y-4">
          {module.units.map((unit, unitIndex) => {
            const isExpanded = expandedUnit === unit.id;
            const isComplete = completedIds.has(unit.id);
            const unitAnswered = answers[unit.id] ?? null;
            const isAnswerCorrect = unitAnswered !== null && unitAnswered === unit.quiz?.answerIndex;
            const checklistState = checked[unit.id] ?? {};

            return (
              <div key={unit.id} className={`glass-card overflow-hidden transition-all ${isComplete ? "border-l-4 border-l-emerald-400" : ""}`}>
                <button
                  onClick={() => toggleUnit(unit.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-white/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                      isComplete ? "bg-emerald-500 text-white" : "bg-sky-50 text-sky-500"
                    }`}>
                      {isComplete ? <CheckCircle2 className="w-5 h-5" /> : unitIndex + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-on-surface">{unit.title}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {unit.minutes} min
                        {unit.quiz && <span className="ml-2 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">quiz</span>}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="px-5 pb-6 space-y-5 animate-fade-in">
                    <div className="whitespace-pre-line text-sm text-slate-700 leading-7 bg-white/50 border border-white/60 rounded-2xl p-5">
                      {unit.content}
                    </div>

                    {unit.checklist.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Apply it</p>
                        <div className="space-y-1.5">
                          {unit.checklist.map((item, checklistIndex) => (
                            <label key={item} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/50 transition-colors cursor-pointer">
                              <span
                                onClick={() => toggleChecklistItem(unit.id, checklistIndex)}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-white transition-all ${
                                  checklistState[checklistIndex] ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                                }`}
                              >
                                {checklistState[checklistIndex] && <CheckCircle2 className="w-4 h-4" />}
                              </span>
                              <span className="text-sm text-slate-600">{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {unit.quiz && (
                      <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-5">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Quick check</p>
                        <p className="font-semibold text-slate-800 mb-3">{unit.quiz.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {unit.quiz.options.map((option, optionIndex) => {
                            const picked = unitAnswered === optionIndex;
                            const isRight = optionIndex === unit.quiz?.answerIndex;
                            return (
                              <button
                                key={option}
                                onClick={() => selectAnswer(unit.id, optionIndex, unit.quiz!)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-left border transition-all ${
                                  picked && isRight
                                    ? "bg-emerald-500 text-white border-emerald-500"
                                    : picked
                                      ? "bg-rose-500 text-white border-rose-500"
                                      : isRight && unitAnswered !== null
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                        : "bg-white/70 text-slate-700 border-white/80 hover:border-sky-300"
                                }`}
                              >
                                <span className="font-black">{String.fromCharCode(65 + optionIndex)}.</span>
                                <span>{option}</span>
                              </button>
                            );
                          })}
                        </div>
                        {unitAnswered !== null && (
                          <div className={`mt-3 text-sm font-medium ${isAnswerCorrect ? "text-emerald-700" : "text-rose-600"}`}>
                            {isAnswerCorrect ? "Correct! " : "Not quite. "}
                            {unit.quiz?.explanation}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() => markComplete(unit.id)}
                        disabled={isComplete}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                          isComplete
                            ? "bg-emerald-50 text-emerald-600 cursor-default"
                            : "bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-200 hover:scale-105"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isComplete ? "Completed" : "Mark unit complete"}
                      </button>
                      {unitIndex < module.units.length - 1 ? (
                        <span className="text-xs text-slate-400">Next: {module.units[unitIndex + 1].title}</span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">Last unit — finish the track! 🎉</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section id="resources">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold text-on-surface flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" /> Go deeper
          </h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">curated external resources</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {module.externalResources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-5 hover:border-sky-200 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">{resource.type}</span>
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
              </div>
              <p className="font-semibold text-on-surface text-sm leading-5 group-hover:text-sky-600 transition-colors">
                {resource.title}
              </p>
            </a>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Link
          href={`/applicant/mentor?skill=${encodeURIComponent(module.skill)}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-full font-semibold shadow-lg shadow-sky-200 hover:scale-105 transition-all"
        >
          Practice this skill with the mentor <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}