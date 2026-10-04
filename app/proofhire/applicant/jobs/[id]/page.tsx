"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Lightbulb,
  BookOpen,
  CirclePlay,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Database,
  Timer,
  CloudOff,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button, Card, Badge, Skeleton } from "@/components/ui";

interface ChallengeData {
  id: string;
  title: string;
  type: string;
  instructions: string;
  prompt: string;
  starterCode?: string;
  starterQuery?: string;
  requiredSkills: string[];
  hints: Array<{ id: string; text: string; source: string }>;
  references: Array<{ id: string; title: string; url: string; type: string }>;
  timeLimit?: number; // seconds (optional from API)
  documentConfig?: {
    requiredSections: string[];
    requiredKeywords: string[];
    minLength: number;
    maxLength: number;
  };
  sqlConfig?: {
    schema: { tables: string[]; columns: string[] };
    validPatterns: string[];
    blockedKeywords: string[];
  };
}

const DEFAULT_TIME_LIMIT = 60 * 60; // 60 min fallback
const AUTOSAVE_MS = 30_000;

function draftKey(jobId: string) {
  return `intore_proofhire_draft_${jobId}`;
}
function deadlineKey(jobId: string) {
  return `intore_proofhire_deadline_${jobId}`;
}

function formatClock(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export default function ApplicantAssessmentPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [mode, setMode] = useState<"required" | "optional">("optional");
  const [code, setCode] = useState("");
  const [evaluation, setEvaluation] = useState<{ score: number; summary: string; strengths: string[]; gaps: string[] } | null>(null);
  const [message, setMessage] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [offlineBackup, setOfflineBackup] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);

  const codeRef = useRef(code);
  codeRef.current = code;
  const userRef = useRef(user);
  userRef.current = user;
  const autoSubmittedRef = useRef(false);

  // Load challenge + prior submission; restore local draft backup.
  useEffect(() => {
    let cancelled = false;
    api.proofhire.getChallengeForJob(jobId)
      .then(({ challenge: challengeData, mode: challengeMode }) => {
        if (cancelled) return;
        const full = challengeData as ChallengeData;
        setChallenge(full);
        setMode(challengeMode);
        const limit = full.timeLimit ?? DEFAULT_TIME_LIMIT;
        try {
          const stored = window.localStorage.getItem(deadlineKey(jobId));
          let deadline = stored ? Number(stored) : NaN;
          if (!Number.isFinite(deadline) || deadline < Date.now()) {
            deadline = Date.now() + limit * 1000;
            window.localStorage.setItem(deadlineKey(jobId), String(deadline));
          }
          setSecondsLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
        } catch {
          setSecondsLeft(limit);
        }
        // Local backup wins over starter text (server submission loads below and overrides when present).
        try {
          const backup = window.localStorage.getItem(draftKey(jobId));
          if (backup !== null) {
            setCode(backup);
            setOfflineBackup(true);
            return;
          }
        } catch {
          // ignore
        }
        if (full.type === "sql") {
          setCode(full.starterQuery || "");
        } else {
          setCode(full.starterCode || "");
        }
      })
      .catch((error) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Failed to load challenge");
      });

    if (user) {
      api.proofhire.getSubmission(jobId)
        .then(({ submission }) => {
          if (cancelled || !submission) return;
          setCode(submission.code);
          setOfflineBackup(false);
          try {
            window.localStorage.setItem(draftKey(jobId), submission.code);
          } catch {
            // ignore
          }
          if (submission.evaluation) {
            setEvaluation(submission.evaluation);
          }
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [jobId, user]);

  // Countdown ticker.
  useEffect(() => {
    if (secondsLeft === null || timeUp) return;
    if (secondsLeft <= 0) {
      setTimeUp(true);
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => (s === null ? s : s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft, timeUp]);

  const saveDraft = useCallback(async (silent = false) => {
    const t = userRef.current;
    if (!t || !challenge) return;
    if (!silent) setSaving(true);
    try {
      await api.proofhire.saveSubmission(jobId, { code: codeRef.current, language: "typescript" });
      setLastSavedAt(new Date().toISOString());
      setDirty(false);
      setOfflineBackup(false);
      if (!silent) setMessage("Draft saved.");
    } catch (error) {
      // Keep a local backup so no work is lost when the API is unreachable.
      try {
        window.localStorage.setItem(draftKey(jobId), codeRef.current);
        setOfflineBackup(true);
      } catch {
        // ignore
      }
      if (!silent) setMessage(error instanceof Error ? error.message : "Failed to save draft. Kept a local backup.");
    } finally {
      if (!silent) setSaving(false);
    }
  }, [challenge, jobId]);

  const submitForEvaluation = useCallback(async () => {
    if (!userRef.current || autoSubmittedRef.current && timeUp) return;
    setSubmitting(true);
    try {
      await api.proofhire.saveSubmission(jobId, { code: codeRef.current, language: "typescript" });
      const response = await api.proofhire.evaluateSubmission(jobId);
      if (response.evaluation) {
        setEvaluation(response.evaluation as { score: number; summary: string; strengths: string[]; gaps: string[] });
      }
      setLastSavedAt(new Date().toISOString());
      setDirty(false);
      try {
        window.localStorage.removeItem(draftKey(jobId));
        window.localStorage.removeItem(deadlineKey(jobId));
      } catch {
        // ignore
      }
      setMessage(`Submission evaluated. Current status: ${response.proofStatus}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to evaluate submission.");
    } finally {
      setSubmitting(false);
    }
  }, [jobId, timeUp]);

  // Auto-submit once when the timer hits zero.
  useEffect(() => {
    if (timeUp && !autoSubmittedRef.current && !evaluation && userRef.current) {
      autoSubmittedRef.current = true;
      setMessage("Time is up — auto-submitting your solution.");
      void submitForEvaluation();
    }
  }, [timeUp, evaluation, submitForEvaluation]);

  // Autosave every 30s when dirty.
  useEffect(() => {
    if (!challenge || !user) return;
    const t = window.setInterval(() => {
      if (codeRef.current.trim().length > 0) {
        // Always refresh the local backup; hit the API when dirty.
        try {
          window.localStorage.setItem(draftKey(jobId), codeRef.current);
        } catch {
          // ignore
        }
        if (dirty) void saveDraft(true);
      }
    }, AUTOSAVE_MS);
    return () => window.clearInterval(t);
  }, [challenge, user, dirty, jobId, saveDraft]);

  // Warn on accidental navigation with unsaved work.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    setDirty(true);
  };

  if (!challenge) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <Card>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500" />
            <p className="text-sm font-semibold text-slate-600">{message || "Loading assessment..."}</p>
          </div>
          <Skeleton lines={3} className="mt-4" />
        </Card>
      </div>
    );
  }

  const isDocument = challenge.type === "document";
  const isSQL = challenge.type === "sql";
  const limit = challenge.timeLimit ?? DEFAULT_TIME_LIMIT;
  const progress = evaluation ? 100 : code.trim().length === 0 ? 5 : lastSavedAt ? 65 : 35;
  const urgent = secondsLeft !== null && secondsLeft <= 5 * 60;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[1fr_320px]">
      <Card padding="lg">
        <div className="mb-5">
          <Link
            href={`/applicant/jobs/${jobId}`}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to job
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-black tracking-tight text-on-surface sm:text-3xl">{challenge.title}</h1>
            <Badge tone="info" className="capitalize">{challenge.type}</Badge>
          </div>
          <p className="mt-2 text-slate-500">{challenge.instructions}</p>
          <p className={`mt-3 text-sm font-bold ${mode === "required" ? "text-amber-600" : "text-emerald-600"}`}>
            {mode === "required" ? "Required assessment" : "Optional assessment boost"}
          </p>
          <Link
            href={`/applicant/training/practice/${challenge.id}`}
            className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-emerald-600 underline hover:text-emerald-800"
          >
            <CirclePlay className="h-4 w-4" aria-hidden="true" /> Practice this challenge without affecting your record
          </Link>
        </div>

        {/* Timer + progress */}
        <div className="glass-panel mb-4 p-4" role="status" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={`flex items-center gap-2 text-sm font-bold ${urgent || timeUp ? "text-red-600" : "text-slate-700"}`}>
              <Timer className="h-4 w-4" aria-hidden="true" />
              {timeUp ? "Time is up — auto-submitting…" : secondsLeft === null ? "Loading timer…" : `Time left: ${formatClock(secondsLeft)}`}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              {evaluation ? "Evaluated" : lastSavedAt ? `Draft saved ${new Date(lastSavedAt).toLocaleTimeString()}` : dirty ? "Unsaved changes" : "No changes yet"} · autosaves every 30s
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={Math.round((1 - (secondsLeft ?? limit) / limit) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Time elapsed">
            <div
              className={`h-full rounded-full transition-all ${urgent || timeUp ? "bg-red-500" : "bg-gradient-to-r from-sky-400 to-indigo-500"}`}
              style={{ width: `${Math.min(100, Math.max(0, (1 - (secondsLeft ?? limit) / limit) * 100))}%` }}
            />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Assessment progress">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          {offlineBackup && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <CloudOff className="h-3.5 w-3.5" aria-hidden="true" /> Local backup kept — it will sync on the next successful save.
            </p>
          )}
        </div>

        <div className="glass-panel mb-4 p-4 text-sm leading-6 text-slate-700">{challenge.prompt}</div>

        <div className="mb-4 flex flex-wrap gap-2">
          {challenge.requiredSkills.map((skill) => (
            <Badge key={skill} tone="info">{skill}</Badge>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          {!!challenge.hints?.length && (
            <Button variant="secondary" size="sm" onClick={() => setShowHints(!showHints)} aria-expanded={showHints}>
              <Lightbulb className="h-4 w-4" aria-hidden="true" /> Hints ({challenge.hints?.length || 0})
            </Button>
          )}
          {!!challenge.references?.length && (
            <Button variant="secondary" size="sm" onClick={() => setShowReferences(!showReferences)} aria-expanded={showReferences}>
              <BookOpen className="h-4 w-4" aria-hidden="true" /> References ({challenge.references?.length || 0})
            </Button>
          )}
        </div>

        {showHints && !!challenge.hints?.length && (
          <div className="glass-panel mb-4 border-amber-200 bg-amber-50/60 p-4">
            <p className="mb-2 font-bold text-amber-800">Available Hints</p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-amber-900">
              {challenge.hints?.map((hint) => (
                <li key={hint.id}>
                  {hint.text}
                  {hint.source === "system" && (
                    <span className="ml-1.5 text-[11px] font-semibold text-amber-600">(system hint)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showReferences && !!challenge.references?.length && (
          <div className="glass-panel mb-4 border-sky-200 bg-sky-50/60 p-4">
            <p className="mb-2 font-bold text-sky-800">Helpful References</p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-sky-900">
              {challenge.references?.map((ref) => (
                <li key={ref.id}>
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-600 underline hover:text-sky-800">
                    {ref.title}
                  </a>
                  <span className="ml-1.5 text-[11px] text-slate-500">({ref.type})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isSQL && (
          <div className="glass-panel mb-4 flex items-start gap-2 p-3 text-[13px] text-slate-600">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
            <p><strong>SQL Tips:</strong> Use SELECT, FROM, WHERE, ORDER BY, LIMIT. Avoid blocked keywords: {challenge.sqlConfig?.blockedKeywords?.join(", ")}.</p>
          </div>
        )}

        {isDocument && challenge.documentConfig && (
          <div className="glass-panel mb-4 flex items-start gap-2 p-3 text-[13px] text-slate-600">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
            <p><strong>Requirements:</strong> {challenge.documentConfig.minLength}-{challenge.documentConfig.maxLength} words. Include: {challenge.documentConfig.requiredKeywords?.join(", ")}.</p>
          </div>
        )}

        <div>
          <label htmlFor="solution-editor" className="mb-2 block text-sm font-bold text-slate-700">
            {isSQL ? "Your SQL Query" : isDocument ? "Your Document" : "Your Solution"}
          </label>
          <textarea
            id="solution-editor"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            rows={isDocument ? 12 : 22}
            placeholder={
              isSQL
                ? "SELECT name, score FROM candidates ORDER BY score DESC LIMIT 10"
                : isDocument
                ? "Write your cover letter here..."
                : "// Write your code here"
            }
            className={`w-full resize-y rounded-xl border border-slate-300 bg-white/80 p-4 text-sm outline-none placeholder:text-slate-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 ${isSQL || !isDocument ? "font-mono" : "font-sans"}`}
          />
        </div>

        {/* Desktop actions */}
        <div className="mt-4 hidden flex-wrap gap-3 sm:flex">
          <Button variant="secondary" onClick={() => saveDraft()} loading={saving} disabled={!user || timeUp}>
            <Save className="h-4 w-4" aria-hidden="true" /> Save Draft
          </Button>
          <Button variant="primary" onClick={submitForEvaluation} loading={submitting} disabled={!user}>
            <Send className="h-4 w-4" aria-hidden="true" /> Submit for Evaluation
          </Button>
        </div>
        {message && (
          <p role="status" className="mt-3 text-sm font-semibold text-indigo-600">{message}</p>
        )}
        {/* Mobile sticky action bar */}
        <div className="sticky bottom-3 mt-4 flex gap-3 rounded-2xl border border-white/60 bg-white/85 p-3 shadow-lg backdrop-blur-xl sm:hidden">
          <Button variant="secondary" onClick={() => saveDraft()} loading={saving} disabled={!user || timeUp} className="flex-1">
            <Save className="h-4 w-4" aria-hidden="true" /> Save
          </Button>
          <Button variant="primary" onClick={submitForEvaluation} loading={submitting} disabled={!user} className="flex-1">
            <Send className="h-4 w-4" aria-hidden="true" /> Submit
          </Button>
        </div>
      </Card>

      {!isDocument && (
        <Card padding="md" className="self-start">
          <h2 className="font-display text-lg font-bold text-on-surface">Evaluation</h2>
          {evaluation ? (
            <div className="mt-3">
              <p className="font-display text-4xl font-black text-emerald-600">{evaluation.score}%</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{evaluation.summary}</p>
              <div className="mt-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Strengths
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {evaluation.strengths.map((strength) => <li key={strength}>{strength}</li>)}
                </ul>
              </div>
              <div className="mt-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-amber-700">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Gaps
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {evaluation.gaps.map((gap) => <li key={gap}>{gap}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No evaluation yet. Submit your solution to get verified feedback.</p>
          )}
        </Card>
      )}
    </div>
  );
}
