"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  CirclePlay,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Bot,
  ArrowRight,
  Timer,
  Flame,
  Target,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type {
  PracticeChallengeLite,
  TrainingLevel,
  TrainingModule,
  TrainingQuizQuestion,
} from "@/lib/types";
import { Card, Badge, Tabs, Skeleton } from "@/components/ui";

interface BankQuestion extends TrainingQuizQuestion {
  key: string;
  skill: string;
  moduleId: string;
  moduleTitle: string;
  level: TrainingLevel;
}

const STORAGE_KEY = "intoreai_prep_answers";

function loadAnswered(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export default function PrepPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [challenges, setChallenges] = useState<PracticeChallengeLite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [tab, setTab] = useState("drills");
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    api.training
      .listModules()
      .then(({ modules: catalog }) => setModules(catalog))
      .catch((err) => console.error("Failed to load prep catalog:", err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.training
      .listPracticeChallenges()
      .then(({ challenges: list }) => setChallenges(list))
      .catch((err) => console.error("Failed to load practice challenges:", err));
  }, [user]);

  useEffect(() => {
    setAnswered(loadAnswered());
  }, []);

  const bank: BankQuestion[] = useMemo(
    () =>
      modules.flatMap((m) =>
        m.units
          .filter((u) => u.quiz)
          .map((u) => ({
            ...(u.quiz as TrainingQuizQuestion),
            key: `${m.id}:${u.id}`,
            skill: m.skill,
            moduleId: m.id,
            moduleTitle: m.title,
            level: m.level,
          })),
      ),
    [modules],
  );

  const skills = useMemo(
    () => Array.from(new Set(modules.map((m) => m.skill))).sort(),
    [modules],
  );

  const filteredBank = useMemo(
    () =>
      bank.filter((q) => {
        const hay = `${q.skill} ${q.moduleTitle} ${q.question}`.toLowerCase();
        const matchesRole = !roleFilter || hay.includes(roleFilter.toLowerCase());
        const matchesLevel = levelFilter === "all" || q.level === levelFilter;
        return matchesRole && matchesLevel;
      }),
    [bank, roleFilter, levelFilter],
  );

  const filteredChallenges = useMemo(
    () =>
      challenges.filter((c) => {
        if (!roleFilter) return true;
        const hay = `${c.title} ${c.jobTitle} ${c.requiredSkills.join(" ")}`.toLowerCase();
        return hay.includes(roleFilter.toLowerCase());
      }),
    [challenges, roleFilter],
  );

  const correctCount = useMemo(
    () => Object.values(answered).filter(Boolean).length,
    [answered],
  );

  const answer = (key: string, optionIdx: number, correctIdx: number) => {
    if (picked[key] !== undefined) return;
    const correct = optionIdx === correctIdx;
    setPicked((p) => ({ ...p, [key]: optionIdx }));
    setAnswered((a) => {
      const next = { ...a, [key]: correct };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — session-only */
      }
      return next;
    });
    setStreak((s) => (correct ? s + 1 : 0));
  };

  const resetSession = () => {
    setPicked({});
    setStreak(0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6" aria-label="Loading prep room">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="md">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-3 h-8 w-1/3" />
            </Card>
          ))}
        </div>
        <Card padding="lg">
          <Skeleton lines={4} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 p-2.5 text-white shadow-lg shadow-emerald-200">
            <Target className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Prep Room</h1>
            <p className="text-slate-500">
              Question bank filtered by role — practice answers, zero impact on your record.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <PrepStat icon={GraduationCap} label="Bank questions" value={bank.length} tone="text-sky-500 bg-sky-50" />
        <PrepStat icon={CirclePlay} label="Live challenges" value={challenges.length} tone="text-emerald-500 bg-emerald-50" />
        <PrepStat icon={CheckCircle2} label="Answered right" value={correctCount} tone="text-indigo-500 bg-indigo-50" />
        <PrepStat icon={Flame} label="Streak" value={streak} tone="text-amber-500 bg-amber-50" />
      </div>

      <Card padding="md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <span className="sr-only">Filter by role or skill</span>
            <input
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              placeholder="Filter by role or skill — try React, SQL, design…"
              list="prep-skills"
              className="min-h-[44px] w-full rounded-2xl border border-white/60 bg-white/60 py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-slate-300 focus:ring-4 focus:ring-sky-500/10"
            />
            <datalist id="prep-skills">
              {skills.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <div className="flex gap-2" role="group" aria-label="Level filter">
            {["all", "beginner", "intermediate", "advanced"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                aria-pressed={levelFilter === lvl}
                className={`min-h-[44px] rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                  levelFilter === lvl
                    ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-200"
                    : "bg-white/60 text-slate-500 hover:bg-white hover:text-on-surface"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Tabs
        tabs={[
          { id: "drills", label: `Quick drills (${filteredBank.length})` },
          { id: "challenges", label: `Employer challenges (${filteredChallenges.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "drills" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Timer className="h-4 w-4" aria-hidden="true" /> Self-paced · instant feedback · signals quiz mastery
            </p>
            {Object.keys(picked).length > 0 && (
              <button
                onClick={resetSession}
                className="btn-ghost min-h-[44px] rounded-full text-xs font-bold uppercase tracking-widest"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset session
              </button>
            )}
          </div>

          {filteredBank.map((q) => {
            const choice = picked[q.key];
            const revealed = choice !== undefined;
            return (
              <Card key={q.key} padding="md">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      q.level === "beginner"
                        ? "level-beginner"
                        : q.level === "advanced"
                          ? "level-advanced"
                          : "level-intermediate"
                    }
                  >
                    {q.level}
                  </Badge>
                  <Badge tone="info">{q.skill}</Badge>
                  <span className="text-xs text-slate-400">from {q.moduleTitle}</span>
                </div>
                <p className="font-display font-bold text-on-surface">{q.question}</p>
                <div className="mt-3 grid gap-2" role="group" aria-label={`Options for: ${q.question}`}>
                  {q.options.map((opt, idx) => {
                    const isAnswer = idx === q.answerIndex;
                    const isChoice = idx === choice;
                    const tone = !revealed
                      ? "border-white/60 bg-white/60 hover:border-sky-300 hover:bg-sky-50"
                      : isAnswer
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : isChoice
                          ? "border-red-300 bg-red-50 text-red-800"
                          : "border-white/60 bg-white/40 opacity-60";
                    return (
                      <button
                        key={idx}
                        disabled={revealed}
                        onClick={() => answer(q.key, idx, q.answerIndex)}
                        aria-pressed={isChoice}
                        className={`flex min-h-[44px] items-center gap-3 rounded-2xl border px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-all ${tone}`}
                      >
                        <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-black text-slate-500">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                        {revealed && isAnswer && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" aria-label="Correct answer" />}
                        {revealed && isChoice && !isAnswer && <XCircle className="ml-auto h-4 w-4 shrink-0 text-red-500" aria-label="Your wrong answer" />}
                      </button>
                    );
                  })}
                </div>
                {revealed && (
                  <div className={`mt-3 rounded-2xl border p-3 text-sm leading-6 ${choice === q.answerIndex ? "border-emerald-200 bg-emerald-50/60 text-emerald-800" : "border-amber-200 bg-amber-50/60 text-amber-800"}`}>
                    <strong>{choice === q.answerIndex ? "Correct. " : "Not quite. "}</strong>
                    {q.explanation}
                    <Link href={`/applicant/training/${q.moduleId}`} className="ml-2 font-semibold underline hover:opacity-80">
                      Study this unit
                    </Link>
                  </div>
                )}
              </Card>
            );
          })}

          {filteredBank.length === 0 && (
            <Card padding="lg" className="text-center">
              <p className="font-semibold text-slate-500">No drills match this filter.</p>
              <p className="mt-1 text-sm text-slate-400">Try another role, skill, or level.</p>
            </Card>
          )}
        </section>
      )}

      {tab === "challenges" && (
        <section className="space-y-4">
          {!user && (
            <Card padding="md" className="border-sky-200 bg-sky-50/50 text-center">
              <p className="text-sm font-semibold text-sky-800">
                Sign in to open full employer challenges with instant, non-recorded evaluation.
              </p>
              <Link href="/login" className="btn-primary mt-3 inline-flex rounded-full px-6 py-2.5 text-sm">
                Sign In <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Card>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredChallenges.map((c) => (
              <Link
                key={c.challengeId}
                href={`/applicant/training/practice/${c.challengeId}`}
                className="glass-card group flex items-center justify-between p-5 transition-all hover:border-emerald-200"
              >
                <span className="flex items-center gap-4">
                  <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    <CirclePlay className="h-6 w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-on-surface">{c.title}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <Badge tone="default" className="uppercase">{c.type}</Badge>
                      <span className="max-w-48 truncate">for {c.jobTitle}</span>
                    </span>
                    {c.requiredSkills.length > 0 && (
                      <span className="mt-1.5 flex flex-wrap gap-1">
                        {c.requiredSkills.slice(0, 3).map((s) => (
                          <Badge key={s} tone="info">{s}</Badge>
                        ))}
                      </span>
                    )}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-emerald-500" aria-hidden="true" />
              </Link>
            ))}
          </div>
          {filteredChallenges.length === 0 && (
            <Card padding="lg" className="text-center">
              <p className="font-semibold text-slate-500">No employer challenges for this filter yet.</p>
              <p className="mt-1 text-sm text-slate-400">Try the quick drills above, or browse open jobs.</p>
              <Link href="/applicant/jobs" className="btn-secondary mt-4 inline-flex rounded-full px-6 py-2.5 text-sm">
                Browse jobs
              </Link>
            </Card>
          )}
        </section>
      )}

      <Card padding="md" className="border-indigo-100 bg-indigo-50/30">
        <p className="flex items-center gap-2 font-bold text-indigo-800">
          <Bot className="h-5 w-5" aria-hidden="true" /> Stuck on a topic?
        </p>
        <p className="mt-1 text-sm leading-6 text-indigo-700">
          The AI Mentor coaches you topic-by-topic with live quizzes — same bank, guided mode.
        </p>
        <Link href="/applicant/mentor" className="btn-primary mt-3 inline-flex rounded-full px-6 py-2.5 text-sm">
          Ask the AI Mentor <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Card>

    </div>
  );
}

function PrepStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Target;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card padding="md" className="flex items-center gap-4">
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block font-display text-2xl font-black text-on-surface">{value}</span>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </span>
    </Card>
  );
}
