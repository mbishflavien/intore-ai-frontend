"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CirclePlay,
  Lightbulb,
  ExternalLink,
  Beaker,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { ProofChallenge } from "@/lib/types";

interface Evaluation {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
}

export default function PracticePage() {
  const params = useParams();
  const challengeId = (params.challengeId as string) ?? "";
  const { token } = useAuth();
  const [challenge, setChallenge] = useState<ProofChallenge | null>(null);
  const [code, setCode] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    api.training
      .getPracticeChallenge(challengeId, token)
      .then(({ challenge: data }) => {
        setChallenge(data);
        setCode(data.type === "sql" ? data.starterQuery ?? "" : data.starterCode ?? "");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Failed to load challenge"));
  }, [challengeId, token]);

  const evaluate = async () => {
    if (!token) return;
    setIsEvaluating(true);
    setMessage("");
    try {
      const { evaluation: result } = await api.training.practiceEvaluate(challengeId, code, token);
      setEvaluation(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to evaluate.");
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!token) {
    return (
      <div className="glass-card p-16 text-center space-y-4">
        <CirclePlay className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-on-surface">Sign in to practice</h2>
        <p className="text-slate-500">Train on real employer challenges without affecting your record.</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-full font-semibold shadow-lg shadow-emerald-200 hover:scale-105 transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-slate-500 mb-4">{message || "Loading challenge..."}</p>
        <Link href="/applicant/training" className="text-emerald-600 font-semibold hover:underline">← Back to Learning Hub</Link>
      </div>
    );
  }

  const isSQL = challenge.type === "sql";
  const isDocument = challenge.type === "document";

  return (
    <div className="space-y-6">
      <Link href="/applicant/training" className="inline-flex items-center gap-2 text-emerald-600 text-sm font-semibold hover:underline">
        <ArrowLeft className="w-4 h-4" /> Practice Zone
      </Link>

      <section className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <CirclePlay className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-on-surface">{challenge.title}</h1>
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">{challenge.type}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Practice mode — your submission is evaluated but never recorded.</p>
            </div>
          </div>
          <Link href={`/applicant/jobs`} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-500 transition-colors">
            Find an employer challenge <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-sm text-slate-600 mt-3 leading-6">{challenge.instructions}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {challenge.requiredSkills.map((skill) => (
            <span key={skill} className="bg-sky-50 text-sky-600 rounded-full px-3 py-1 text-xs font-semibold">{skill}</span>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isSQL && challenge.sqlConfig && (
            <div className="glass-card p-4 text-xs text-slate-500">
              <strong className="text-slate-600">SQL tips:</strong> Use SELECT, FROM, WHERE, ORDER BY, LIMIT. Avoid blocked keywords: {challenge.sqlConfig.blockedKeywords.join(", ")}.
            </div>
          )}
          {isDocument && challenge.documentConfig && (
            <div className="glass-card p-4 text-xs text-slate-500">
              <strong className="text-slate-600">Requirements:</strong> {challenge.documentConfig.minLength}-{challenge.documentConfig.maxLength} words. Include: {challenge.documentConfig.requiredKeywords.join(", ")}.
            </div>
          )}

          <div className="glass-card p-6 bg-white/40">
            <p className="text-sm text-slate-700 leading-6 whitespace-pre-line">{challenge.prompt}</p>
          </div>

          <div className="flex gap-3">
            {challenge.hints.length > 0 && (
              <button
                onClick={() => setShowHints((previous) => !previous)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                  showHints ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white/60 text-slate-500 border-white/70 hover:border-amber-200"
                }`}
              >
                <Lightbulb className="w-4 h-4" /> Hints ({challenge.hints.length})
              </button>
            )}
            {challenge.references.length > 0 && (
              <button
                onClick={() => setShowReferences((previous) => !previous)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                  showReferences ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-white/60 text-slate-500 border-white/70 hover:border-sky-200"
                }`}
              >
                <ExternalLink className="w-4 h-4" /> References ({challenge.references.length})
              </button>
            )}
          </div>

          {showHints && (
            <div className="glass-card p-5 border-l-4 border-l-amber-400">
              <ul className="space-y-2">
                {challenge.hints.map((hint) => (
                  <li key={hint.id} className="text-sm text-slate-600 flex gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <span>{hint.text}{hint.source === "system" && <span className="text-amber-600 text-xs ml-1">(system hint)</span>}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showReferences && (
            <div className="glass-card p-5 border-l-4 border-l-sky-400">
              <ul className="space-y-2">
                {challenge.references.map((reference) => (
                  <li key={reference.id}>
                    <a href={reference.url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-600 font-medium hover:underline inline-flex items-center gap-1.5">
                      {reference.title} <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-xs text-slate-400 ml-2 uppercase tracking-wider">({reference.type})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className="glass-card p-6">
            <label className="block text-sm font-bold text-on-surface mb-3">
              {isSQL ? "Your SQL query" : isDocument ? "Your document" : "Your solution"}
            </label>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              rows={isDocument ? 12 : 20}
              placeholder={isSQL ? "SELECT name, score FROM candidates ORDER BY score DESC LIMIT 10" : isDocument ? "Write your answer here..." : "// Write your code here"}
              className="w-full rounded-2xl border border-white/70 bg-white/60 p-4 text-sm resize-y outline-none focus:ring-4 ring-emerald-500/10 font-mono"
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> Evaluated instantly · never recorded
              </p>
              <button
                onClick={evaluate}
                disabled={isEvaluating || !code.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <Beaker className="w-4 h-4" />
                {isEvaluating ? "Evaluating..." : "Evaluate my attempt"}
              </button>
            </div>
          </section>

          {message && <p className="text-sm font-semibold text-rose-500">{message}</p>}
        </div>

        <aside className="space-y-5">
          <div className="glass-card p-6">
            <h2 className="font-display font-bold text-on-surface mb-2">Coach feedback</h2>
            {evaluation ? (
              <div className="space-y-4">
                <div className="text-center">
                  <span className={`font-display text-5xl font-black ${evaluation.score >= 70 ? "text-emerald-500" : evaluation.score >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                    {evaluation.score}%
                  </span>
                  {evaluation.score >= 70 && <p className="text-xs font-bold text-emerald-600 mt-1">Passing range</p>}
                </div>
                <p className="text-sm text-slate-600 leading-6">{evaluation.summary}</p>
                {evaluation.strengths.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Strengths</p>
                    <ul className="space-y-1.5">
                      {evaluation.strengths.map((strength) => (
                        <li key={strength} className="text-xs text-slate-600 flex gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span> {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluation.gaps.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Gaps to improve</p>
                    <ul className="space-y-1.5">
                      {evaluation.gaps.map((gap) => (
                        <li key={gap} className="text-xs text-slate-600 flex gap-2">
                          <span className="text-amber-500 mt-0.5">→</span> {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 leading-6">
                Submit your attempt to get scored feedback with strengths and gaps — skip the self-doubt, learn by doing.
              </p>
            )}
          </div>

          <Link
            href="/applicant/mentor"
            className="glass-card p-5 hover:border-emerald-200 transition-all flex items-center gap-3"
          >
            <span className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-on-surface">Stuck?</p>
              <p className="text-xs text-slate-400">Ask the AI mentor to coach this skill.</p>
            </div>
          </Link>
        </aside>
      </div>
    </div>
  );
}