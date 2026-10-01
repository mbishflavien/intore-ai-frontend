"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Calendar,
  Video,
  PhoneCall,
  Building2,
  Clock,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Interview, Application, RankedCandidate } from "@/lib/types";

// Dimensions shown in the comparison grid
const DIMENSIONS = ["skills", "experience", "education", "relevance"] as const;

const DIMENSION_COLORS: Record<string, string> = {
  skills: "text-sky-600",
  experience: "text-indigo-600",
  education: "text-violet-600",
  relevance: "text-cyan-600",
};

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 65) return "text-sky-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-500";
}

function ratingLabel(score: number) {
  if (score >= 80) return "Strong Yes";
  if (score >= 65) return "Yes";
  if (score >= 50) return "Maybe";
  return "No";
}

export default function InterviewerComparisonPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const candidateId = params.id as string;
  const jobId = searchParams.get("jobId") ?? "";

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidate, setCandidate] = useState<RankedCandidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const [{ interviews: ivs }, { applications }] = await Promise.all([
          api.interviews.list(token!),
          api.jobs.getApplications(jobId, token!),
        ]);
        const candidateInterviews = ivs.filter(
          (iv: Interview) => iv.candidateId === candidateId
        );
        setInterviews(candidateInterviews);
        const app = applications.find(
          (a: Application) => a.applicantId === candidateId
        );
        const shortlist = app?.screeningResult?.shortlisted ?? [];
        const ranked = shortlist.find(
          (c: RankedCandidate) => c.applicantId === candidateId
        ) ?? null;
        setCandidate(ranked);
      } catch (err) {
        console.error("Failed to load comparison data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [token, candidateId, jobId]);

  const fullName = candidate?.fullName ?? "Candidate";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Only completed interviews carry useful notes for comparison
  const completed = interviews.filter((iv) => iv.status === "completed");
  const scheduled = interviews.filter((iv) => iv.status === "scheduled");

  // Consensus: average of AI score dimensions as a proxy when interviewer scores aren't separate
  const avgTotal = candidate
    ? Math.round(
        (candidate.score.skills +
          candidate.score.experience +
          candidate.score.education +
          candidate.score.relevance) /
          4
      )
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/60 rounded-full transition-colors text-slate-400 hover:text-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-sm text-slate-400 flex items-center gap-1.5">
          <Link href="/recruiter/jobs" className="hover:text-sky-500 transition-colors">
            Jobs
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href={jobId ? `/recruiter/jobs/${jobId}/applicants` : "/recruiter/jobs"}
            className="hover:text-sky-500 transition-colors"
          >
            Applicants
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href={`/recruiter/candidates/${candidateId}?jobId=${jobId}`}
            className="hover:text-sky-500 transition-colors"
          >
            {fullName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-semibold">Interviewer Comparison</span>
        </div>
      </div>

      {/* Hero */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-sky-100 shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-black text-on-surface">{fullName}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {interviews.length} interview{interviews.length !== 1 ? "s" : ""} on record ·{" "}
              {completed.length} completed · {scheduled.length} upcoming
            </p>
          </div>
          <div className="flex gap-6 shrink-0">
            <div className="text-center">
              <div className="text-3xl font-black text-sky-600">{completed.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-amber-500">{scheduled.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upcoming</div>
            </div>
          </div>
        </div>
      </div>

      {interviews.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">No interviews scheduled yet</p>
          <p className="text-sm text-slate-400 max-w-xs">
            Schedule interviews from the applicants page. Once completed, their notes and ratings will appear here.
          </p>
          <button onClick={() => router.back()} className="btn-secondary text-sm mt-2">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      ) : (
        <>
          {/* Comparison grid */}
          <div className="glass-card overflow-hidden">
            {/* Column headers — one per interview */}
            <div
              className="grid border-b border-white/40"
              style={{ gridTemplateColumns: `200px repeat(${interviews.length}, 1fr)` }}
            >
              <div className="p-5 flex items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Dimension
                </span>
              </div>
              {interviews.map((iv, i) => {
                const TypeIcon =
                  iv.type === "video"
                    ? Video
                    : iv.type === "phone"
                    ? PhoneCall
                    : Building2;
                const date = new Date(iv.scheduledAt);
                return (
                  <div
                    key={iv.id}
                    className={`p-5 border-l border-white/40 ${i === 0 ? "bg-sky-50/30" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TypeIcon className="w-4 h-4 text-sky-500" />
                      <span className="text-sm font-bold text-slate-700 capitalize">
                        {iv.type} Interview
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {iv.duration} min
                    </div>
                    <span
                      className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        iv.status === "completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : iv.status === "scheduled"
                          ? "bg-sky-50 text-sky-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {iv.status}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* AI score dimensions as rows */}
            {candidate &&
              DIMENSIONS.map((dim, rowIdx) => (
                <div
                  key={dim}
                  className={`grid border-b border-white/40 ${rowIdx % 2 === 0 ? "bg-white/20" : ""}`}
                  style={{ gridTemplateColumns: `200px repeat(${interviews.length}, 1fr)` }}
                >
                  <div className="p-5 flex items-center">
                    <span
                      className={`text-xs font-bold uppercase tracking-widest capitalize ${DIMENSION_COLORS[dim]}`}
                    >
                      {dim}
                    </span>
                  </div>
                  {interviews.map((iv, i) => (
                    <div
                      key={iv.id}
                      className={`p-5 border-l border-white/40 flex items-center ${i === 0 ? "bg-sky-50/20" : ""}`}
                    >
                      {iv.status === "completed" ? (
                        <div className="space-y-0.5">
                          <span
                            className={`text-2xl font-black ${scoreColor(candidate.score[dim])}`}
                          >
                            {candidate.score[dim]}%
                          </span>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-widest ${scoreColor(candidate.score[dim])}`}
                          >
                            {ratingLabel(candidate.score[dim])}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 font-medium">Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}

            {/* Notes row */}
            <div
              className="grid border-b border-white/40 bg-white/10"
              style={{ gridTemplateColumns: `200px repeat(${interviews.length}, 1fr)` }}
            >
              <div className="p-5 flex items-start pt-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Notes
                </span>
              </div>
              {interviews.map((iv, i) => (
                <div
                  key={iv.id}
                  className={`p-5 border-l border-white/40 ${i === 0 ? "bg-sky-50/20" : ""}`}
                >
                  {iv.notes ? (
                    <p className="text-sm text-slate-600 leading-relaxed italic">"{iv.notes}"</p>
                  ) : (
                    <p className="text-xs text-slate-300">No notes added.</p>
                  )}
                </div>
              ))}
            </div>

            {/* Consensus row */}
            {candidate && (
              <div
                className="grid bg-gradient-to-r from-sky-50/40 to-indigo-50/30"
                style={{ gridTemplateColumns: `200px repeat(${interviews.length}, 1fr)` }}
              >
                <div className="p-5 flex items-center">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    AI Consensus
                  </span>
                </div>
                {interviews.map((iv, i) => (
                  <div
                    key={iv.id}
                    className={`p-5 border-l border-white/40 flex items-center gap-3 ${i === 0 ? "bg-sky-50/20" : ""}`}
                  >
                    {iv.status === "completed" ? (
                      <>
                        {candidate.score.total >= 65 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        )}
                        <div>
                          <span
                            className={`text-xl font-black ${scoreColor(candidate.score.total)}`}
                          >
                            {candidate.score.total}%
                          </span>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {ratingLabel(candidate.score.total)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-300">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendation summary */}
          {candidate && completed.length > 0 && (
            <div className="glass-card p-8 space-y-4">
              <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                AI Hiring Recommendation
              </h3>
              <blockquote className="text-slate-700 leading-relaxed text-[15px] italic font-medium border-l-4 border-indigo-300 pl-5">
                "{candidate.recommendation}"
              </blockquote>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Avg across dimensions
                  </span>
                  <span className={`text-sm font-black ${scoreColor(avgTotal)}`}>
                    {avgTotal}%
                  </span>
                </div>
                <span className="text-slate-200">·</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${scoreColor(candidate.score.total)}`}
                >
                  {ratingLabel(candidate.score.total)}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
