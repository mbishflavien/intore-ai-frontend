"use client";

import { useEffect, useState } from "react";
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

export default function ApplicantAssessmentPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { token } = useAuth();
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [mode, setMode] = useState<"required" | "optional">("optional");
  const [code, setCode] = useState("");
  const [evaluation, setEvaluation] = useState<{ score: number; summary: string; strengths: string[]; gaps: string[] } | null>(null);
  const [message, setMessage] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.proofhire.getChallengeForJob(jobId)
      .then(({ challenge: challengeData, mode: challengeMode }) => {
        setChallenge(challengeData);
        setMode(challengeMode);
        if (challengeData.type === "sql") {
          setCode(challengeData.starterQuery || "");
        } else {
          setCode(challengeData.starterCode || "");
        }
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Failed to load challenge");
      });

    if (token) {
      api.proofhire.getSubmission(jobId, token)
        .then(({ submission }) => {
          if (submission) {
            setCode(submission.code);
            if (submission.evaluation) {
              setEvaluation(submission.evaluation);
            }
          }
        })
        .catch(() => undefined);
    }
  }, [jobId, token]);

  const saveDraft = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await api.proofhire.saveSubmission(jobId, { code, language: "typescript" }, token);
      setMessage("Draft saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  const submitForEvaluation = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await api.proofhire.saveSubmission(jobId, { code, language: "typescript" }, token);
      const response = await api.proofhire.evaluateSubmission(jobId, token);
      if (response.evaluation) {
        setEvaluation(response.evaluation as { score: number; summary: string; strengths: string[]; gaps: string[] });
      }
      setMessage(`Submission evaluated. Current status: ${response.proofStatus}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to evaluate submission.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!challenge) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
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

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <Card padding="lg">
        <div className="mb-5">
          <Link
            href={`/applicant/jobs/${jobId}`}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to job
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-black tracking-tight text-on-surface">{challenge.title}</h1>
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
            onChange={(e) => setCode(e.target.value)}
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

        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={saveDraft} loading={saving} disabled={!token}>
            <Save className="h-4 w-4" aria-hidden="true" /> Save Draft
          </Button>
          <Button variant="primary" onClick={submitForEvaluation} loading={submitting} disabled={!token}>
            <Send className="h-4 w-4" aria-hidden="true" /> Submit for Evaluation
          </Button>
        </div>
        {message && (
          <p role="status" className="mt-3 text-sm font-semibold text-indigo-600">{message}</p>
        )}
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
