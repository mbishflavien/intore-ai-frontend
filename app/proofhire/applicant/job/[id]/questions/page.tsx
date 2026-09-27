"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Lightbulb, Paperclip, Users, ClipboardList, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Card, Badge, Skeleton } from "@/components/ui";

interface Question {
  challengeId: string;
  title: string;
  type: string;
  hintCount: number;
  referenceCount: number;
  submissionCount: number;
  applicantPosition?: string;
}

export default function PreviousQuestionsPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.proofhire.getPreviousQuestions(jobId)
      .then(({ questions: q }) => {
        setQuestions(q);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load questions");
        setLoading(false);
      });
  }, [jobId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6" aria-label="Loading questions">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton lines={3} />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card className="border-red-200 bg-red-50/60 text-center">
          <p className="font-semibold text-red-600" role="alert">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <Link
          href={`/applicant/jobs/${jobId}`}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to job
        </Link>
        <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-on-surface">
          Technical Questions for This Role
        </h1>
        <p className="mt-2 text-slate-500">
          See what kinds of technical questions others faced when applying for this position.
          This helps you prepare and apply with confidence.
        </p>
      </div>

      {questions.length === 0 ? (
        <Card padding="lg" className="text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-100 text-slate-400">
            <ClipboardList className="h-8 w-8" aria-hidden="true" />
          </span>
          <p className="font-semibold text-slate-500">No previous questions recorded yet for this position.</p>
          <p className="mt-2 text-sm text-slate-400">
            Be the first to complete a technical challenge and help others prepare!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {questions.map((q, index) => (
            <Card key={q.challengeId} padding="md">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone="info" className="capitalize">{q.type || "coding"}</Badge>
                  <Badge tone="default">#{index + 1}</Badge>
                </div>
                {q.applicantPosition && (
                  <span className="text-[13px] text-slate-500">
                    Applied for: <strong className="text-slate-700">{q.applicantPosition}</strong>
                  </span>
                )}
              </div>

              <p className="mb-3 font-medium text-slate-700">
                {q.title || "Technical Challenge"}
              </p>

              <div className="flex flex-wrap gap-4 text-[13px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" /> {q.hintCount} hints available
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4 text-sky-500" aria-hidden="true" /> {q.referenceCount} references
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-indigo-500" aria-hidden="true" /> {q.submissionCount} submissions
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card padding="md" className="border-emerald-200 bg-emerald-50/50">
        <h3 className="flex items-center gap-2 font-bold text-emerald-800">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" /> Why see previous questions?
        </h3>
        <p className="mt-2 text-sm leading-6 text-emerald-700">
          By understanding the types of challenges for this role, you can prepare better and know what to expect.
          All questions shown are anonymized - you see the category but not the exact problem.
        </p>
      </Card>
    </div>
  );
}
