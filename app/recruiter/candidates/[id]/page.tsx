"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  Globe,
  ExternalLink as ExternalLinkIcon,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Video,
  PhoneCall,
  Building2,
  Award,
  Code2,
  FileText,
  Activity,
  ChevronRight,
  Download,
  Calendar,
  BarChart3,
  Layers,
  FlaskConical,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type {
  Application,
  RankedCandidate,
  Interview,
  ProofSubmission,
  TalentProfile,
} from "@/lib/types";

type Tab = "overview" | "proofhire" | "interviews" | "profile";

const SCORE_COLORS: Record<string, string> = {
  skills: "from-sky-400 to-sky-500",
  experience: "from-indigo-400 to-indigo-500",
  education: "from-violet-400 to-violet-500",
  relevance: "from-cyan-400 to-cyan-500",
  proof: "from-emerald-400 to-emerald-500",
};

const SCORE_BG: Record<string, string> = {
  skills: "bg-sky-50 text-sky-700 border-sky-100",
  experience: "bg-indigo-50 text-indigo-700 border-indigo-100",
  education: "bg-violet-50 text-violet-700 border-violet-100",
  relevance: "bg-cyan-50 text-cyan-700 border-cyan-100",
  proof: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const CHALLENGE_ICONS: Record<string, React.ReactNode> = {
  coding: <Code2 className="w-4 h-4" />,
  sql: <Layers className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  debug: <FlaskConical className="w-4 h-4" />,
  api: <Activity className="w-4 h-4" />,
  data: <BarChart3 className="w-4 h-4" />,
};

function getRecommendationStyle(score: number) {
  if (score >= 80) return { label: "Strong Yes", color: "text-emerald-600 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" };
  if (score >= 65) return { label: "Yes", color: "text-sky-600 bg-sky-50 border-sky-200", dot: "bg-sky-500" };
  if (score >= 50) return { label: "Maybe", color: "text-amber-600 bg-amber-50 border-amber-200", dot: "bg-amber-500" };
  return { label: "No", color: "text-red-600 bg-red-50 border-red-200", dot: "bg-red-500" };
}

function getRiskStyle(level: string) {
  if (level === "low") return { icon: <ShieldCheck className="w-4 h-4" />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (level === "medium") return { icon: <ShieldAlert className="w-4 h-4" />, color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { icon: <ShieldAlert className="w-4 h-4" />, color: "text-red-600 bg-red-50 border-red-200" };
}

function ScoreRing({ value, size = 120 }: { value: number; size?: number }) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (value / 100);
  const color = value >= 80 ? "#10b981" : value >= 65 ? "#38bdf8" : value >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

function DimensionBar({ label, value, dimension }: { label: string; value: number; dimension: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-black text-slate-700">{value}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${SCORE_COLORS[dimension]}`}
          style={{ width: `${value}%`, transition: "width 1s ease" }}
        />
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-200/50"
          : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? "bg-white/30 text-white" : "bg-slate-100 text-slate-500"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
}

export default function CandidateScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const candidateId = params.id as string;
  const jobId = searchParams.get("jobId") ?? "";

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [application, setApplication] = useState<Application | null>(null);
  const [candidate, setCandidate] = useState<RankedCandidate | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [proofSubmissions, setProofSubmissions] = useState<ProofSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || !jobId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        // Load applications for the job and find this candidate
        const { applications } = await api.jobs.getApplications(jobId, token);
        const app = applications.find((a) => a.applicantId === candidateId);
        if (app) setApplication(app);

        // Extract ranked candidate from screening result
        const shortlist = app?.screeningResult?.shortlisted ?? [];
        const ranked = shortlist.find((c) => c.applicantId === candidateId) ?? null;
        setCandidate(ranked);

        // Load interviews for this candidate
        const { interviews: ivs } = await api.interviews.list(token);
        setInterviews(ivs.filter((iv: Interview) => iv.candidateId === candidateId));

        // Load ProofHire results if available
        try {
          const { submissions } = await api.proofhire.getResults(jobId, token);
          setProofSubmissions(submissions.filter((s: ProofSubmission) => s.applicantId === candidateId));
        } catch {
          // ProofHire may not be enabled for this job
        }
      } catch (err) {
        console.error("Failed to load candidate scorecard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [token, jobId, candidateId]);

  const profile: TalentProfile | null = application?.profile ?? candidate?.profile ?? null;
  const totalScore = candidate?.score.total ?? 0;
  const rec = getRecommendationStyle(totalScore);
  const riskStyle = getRiskStyle(candidate?.fraudRisk?.level ?? "low");
  const proofScore = application?.proofScore ?? candidate?.proof?.score ?? 0;
  const completedInterviews = interviews.filter((iv) => iv.status === "completed");
  const scheduledInterviews = interviews.filter((iv) => iv.status === "scheduled");

  const handleExportCSV = () => {
    if (!candidate || !application) return;
    const rows = [
      ["Field", "Value"],
      ["Name", candidate.fullName],
      ["Email", profile?.email ?? ""],
      ["Headline", profile?.headline ?? ""],
      ["Location", profile?.location ?? ""],
      ["Total Score", `${candidate.score.total}%`],
      ["Skills Score", `${candidate.score.skills}%`],
      ["Experience Score", `${candidate.score.experience}%`],
      ["Education Score", `${candidate.score.education}%`],
      ["Relevance Score", `${candidate.score.relevance}%`],
      ["Proof Score", `${proofScore}%`],
      ["AI Recommendation", candidate.recommendation],
      ["Fraud Risk", candidate.fraudRisk?.level ?? "low"],
      ["Status", application.status],
      ["Matched Skills", candidate.matchedSkills.join("; ")],
      ["Missing Skills", candidate.missingSkills.join("; ")],
      ["Strengths", candidate.strengths.join("; ")],
      ["Gaps", candidate.gaps.join("; ")],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scorecard-${candidate.fullName.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
        <div className="glass-card p-8 space-y-6">
          <div className="flex gap-6">
            <Skeleton className="w-24 h-24 rounded-3xl" />
            <div className="space-y-3 flex-1">
              <Skeleton className="w-64 h-8" />
              <Skeleton className="w-48 h-5" />
              <Skeleton className="w-40 h-5" />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!application && !candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <Target className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-400">Candidate not found</h2>
        <p className="text-sm text-slate-400">This candidate may not have an application yet.</p>
        <button onClick={() => router.back()} className="btn-secondary mt-2">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  const fullName = candidate?.fullName ?? (profile ? `${profile.firstName} ${profile.lastName}` : "Unknown");
  const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl">

      {/* Breadcrumb + export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/60 rounded-full transition-colors text-slate-400 hover:text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-sm text-slate-400 flex items-center gap-1.5">
            <Link href="/recruiter/jobs" className="hover:text-sky-500 transition-colors">Jobs</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={jobId ? `/recruiter/jobs/${jobId}/applicants` : "/recruiter/jobs"}
              className="hover:text-sky-500 transition-colors"
            >
              Applicants
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-600 font-semibold">{fullName}</span>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/60 border border-white text-slate-600 rounded-2xl text-sm font-bold hover:bg-white/80 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Candidate hero card */}
      <div className="glass-card p-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Avatar + identity */}
          <div className="flex gap-6 items-start flex-1">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-[24px] bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-sky-100">
                {initials}
              </div>
              {candidate?.rank && (
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[11px] font-black shadow-md shadow-amber-200">
                  #{candidate.rank}
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-black text-on-surface">{fullName}</h1>
                <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${rec.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${rec.dot}`} />
                  {rec.label}
                </span>
              </div>

              {profile?.headline && (
                <p className="text-slate-500 font-medium">{profile.headline}</p>
              )}

              <div className="flex flex-wrap gap-3 mt-2">
                {profile?.location && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5" /> {profile.location}
                  </span>
                )}
                {profile?.email && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Mail className="w-3.5 h-3.5" /> {profile.email}
                  </span>
                )}
                {profile?.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5" /> {profile.phone}
                  </span>
                )}
              </div>

              {profile?.socialLinks && (
                <div className="flex gap-3 pt-1">
                  {profile.socialLinks.linkedin && (
                    <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500 transition-colors">
                      <ExternalLinkIcon className="w-4 h-4" /> LinkedIn
                    </a>
                  )}
                  {profile.socialLinks.github && (
                    <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors">
                      <ExternalLinkIcon className="w-4 h-4" /> GitHub
                    </a>
                  )}
                  {profile.socialLinks.portfolio && (
                    <a href={profile.socialLinks.portfolio} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-500 transition-colors">
                      <Globe className="w-4 h-4" /> Portfolio
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Score chips */}
          {candidate && (
            <div className="flex gap-3 flex-wrap justify-end shrink-0">
              {(["skills", "experience", "education", "relevance"] as const).map((dim) => (
                <div key={dim} className={`flex flex-col items-center px-4 py-3 rounded-2xl border ${SCORE_BG[dim]} min-w-[72px]`}>
                  <span className="text-xl font-black">{candidate.score[dim]}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-70 capitalize">{dim}</span>
                </div>
              ))}
              <div className={`flex flex-col items-center px-4 py-3 rounded-2xl border ${SCORE_BG.proof} min-w-[72px]`}>
                <span className="text-xl font-black">{proofScore}%</span>
                <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-70">Proof</span>
              </div>
            </div>
          )}
        </div>

        {/* Status row */}
        <div className="mt-6 pt-6 border-t border-white/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
                application?.status === "accepted" ? "bg-emerald-50 text-emerald-600" :
                application?.status === "rejected" ? "bg-red-50 text-red-600" :
                application?.status === "shortlisted" ? "bg-sky-50 text-sky-600" :
                "bg-slate-100 text-slate-500"
              }`}>
                {(application?.status ?? "unknown").replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fraud Risk</span>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border capitalize ${riskStyle.color}`}>
                {riskStyle.icon}
                {candidate?.fraudRisk?.level ?? "low"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ProofHire</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
                application?.proofHireStatus === "passed" ? "bg-emerald-50 text-emerald-600" :
                application?.proofHireStatus === "failed" ? "bg-red-50 text-red-600" :
                "bg-slate-100 text-slate-500"
              }`}>
                {(application?.proofHireStatus ?? "not_required").replace("_", " ")}
              </span>
            </div>
          </div>

          {application?.appliedAt && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Applied {new Date(application.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 bg-white/30 backdrop-blur-xl border border-white/40 rounded-[28px] p-2 w-fit">
        <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<Target className="w-4 h-4" />} label="AI Overview" />
        <TabButton active={activeTab === "proofhire"} onClick={() => setActiveTab("proofhire")} icon={<Zap className="w-4 h-4" />} label="ProofHire" badge={proofSubmissions.length} />
        <TabButton active={activeTab === "interviews"} onClick={() => setActiveTab("interviews")} icon={<Calendar className="w-4 h-4" />} label="Interviews" badge={interviews.length} />
        <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={<FileText className="w-4 h-4" />} label="Full Profile" />
      </div>

      {/* AI Overview tab */}
      {activeTab === "overview" && candidate && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">

            {/* Total fit ring */}
            <div className="glass-card p-8 flex flex-col items-center text-center space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Fit Score</span>
              <div className="relative inline-flex items-center justify-center">
                <ScoreRing value={totalScore} size={160} />
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-black font-display text-on-surface">{totalScore}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">fit</span>
                </div>
              </div>
              <p className={`text-sm font-bold px-4 py-1.5 rounded-full border ${rec.color}`}>
                AI Recommendation: {rec.label}
              </p>
            </div>

            {/* Score breakdown bars */}
            <div className="glass-card p-6 space-y-5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score Breakdown</h3>
              <DimensionBar label="Skills" value={candidate.score.skills} dimension="skills" />
              <DimensionBar label="Experience" value={candidate.score.experience} dimension="experience" />
              <DimensionBar label="Education" value={candidate.score.education} dimension="education" />
              <DimensionBar label="Relevance" value={candidate.score.relevance} dimension="relevance" />
              <DimensionBar label="ProofHire" value={proofScore} dimension="proof" />
            </div>

            {/* Fraud signals */}
            {candidate.fraudRisk?.signals?.length > 0 && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Fraud Signals
                </h3>
                <ul className="space-y-2">
                  {candidate.fraudRisk.signals.map((signal, i) => (
                    <li key={i} className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dealbreaker flags */}
            {candidate.dealbreakerHits?.length > 0 && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5" /> Dealbreaker Flags
                </h3>
                <ul className="space-y-2">
                  {candidate.dealbreakerHits.map((hit, i) => (
                    <li key={i} className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {hit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-6">

            {/* AI reasoning */}
            <div className="glass-card p-8 space-y-4">
              <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> AI Reasoning
              </h3>
              <blockquote className="text-slate-700 leading-relaxed text-[15px] italic font-medium border-l-4 border-indigo-300 pl-5">
                "{candidate.recommendation}"
              </blockquote>
            </div>

            {/* Strengths and gaps */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Key Strengths
                </h3>
                <ul className="space-y-2.5">
                  {candidate.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-6 space-y-4">
                <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> Potential Gaps
                </h3>
                <ul className="space-y-2.5">
                  {candidate.gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Skill match */}
            <div className="glass-card p-6 space-y-5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skill Match</h3>
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Matched</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.matchedSkills.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> {s}
                    </span>
                  ))}
                </div>
              </div>
              {candidate.missingSkills.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Missing</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.missingSkills.map((s) => (
                      <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-semibold">
                        <XCircle className="w-3 h-3" /> {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ProofHire tab */}
      {activeTab === "proofhire" && (
        <div className="space-y-6">
          <div className="glass-card p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h2 className="font-display text-2xl font-black text-on-surface">ProofHire Results</h2>
                <p className="text-sm text-slate-500">Hands-on challenge performance — proof beyond the resume</p>
              </div>
              <div className="flex gap-4 shrink-0">
                <div className="text-center">
                  <div className="text-3xl font-black text-emerald-600">{proofScore}%</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-sky-600">{proofSubmissions.length}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Challenges</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-indigo-600">
                    {proofSubmissions.filter((s) => s.evaluation?.passed).length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passed</div>
                </div>
              </div>
            </div>
          </div>

          {proofSubmissions.length === 0 ? (
            <div className="glass-card p-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <Zap className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">No ProofHire submissions yet</p>
              <p className="text-sm text-slate-400 max-w-xs">
                {application?.proofHireStatus === "not_required"
                  ? "ProofHire was not required for this job."
                  : "The candidate hasn't submitted any challenges yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {proofSubmissions.map((sub) => {
                const ev = sub.evaluation;
                return (
                  <div key={sub.id} className="glass-card p-6 space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                          ev?.passed ? "bg-gradient-to-br from-emerald-400 to-emerald-500" : "bg-gradient-to-br from-red-400 to-red-500"
                        } shadow-md`}>
                          {CHALLENGE_ICONS[sub.language ?? "coding"] ?? <Code2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface capitalize">{sub.language ?? "Challenge"}</p>
                          <p className="text-xs text-slate-400">
                            {sub.submittedAt
                              ? `Submitted ${new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                              : "Draft"}
                          </p>
                        </div>
                      </div>
                      {ev && (
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${ev.passed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                            {ev.passed ? "Passed" : "Failed"}
                          </span>
                          <span className="text-2xl font-black text-on-surface">{ev.score}%</span>
                        </div>
                      )}
                    </div>

                    {ev && (
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: "Correctness", value: ev.correctnessScore },
                          { label: "Quality", value: ev.qualityScore },
                          { label: "Completeness", value: ev.completenessScore },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-white/40 border border-white/60 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black text-on-surface">{value}%</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {ev?.summary && (
                      <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">AI Evaluation</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{ev.summary}</p>
                      </div>
                    )}

                    {ev && (ev.strengths.length > 0 || ev.gaps.length > 0) && (
                      <div className="grid grid-cols-2 gap-4">
                        {ev.strengths.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Strengths</p>
                            {ev.strengths.map((s, i) => (
                              <p key={i} className="text-xs text-slate-700 flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{s}
                              </p>
                            ))}
                          </div>
                        )}
                        {ev.gaps.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Gaps</p>
                            {ev.gaps.map((g, i) => (
                              <p key={i} className="text-xs text-slate-700 flex items-start gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />{g}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Interviews tab */}
      {activeTab === "interviews" && (
        <div className="space-y-6">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-black text-on-surface">Interview History</h2>
                <p className="text-sm text-slate-500 mt-1">All scheduled and completed interviews for this candidate</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-sky-600">{scheduledInterviews.length}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upcoming</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-emerald-600">{completedInterviews.length}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</div>
                </div>
              </div>
            </div>
          </div>

          {interviews.length === 0 ? (
            <div className="glass-card p-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">No interviews scheduled yet</p>
              <p className="text-sm text-slate-400 max-w-xs">Go back to the applicants page to schedule an interview with this candidate.</p>
              <button onClick={() => router.back()} className="btn-secondary text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Applicants
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((iv) => {
                const TypeIcon = iv.type === "video" ? Video : iv.type === "phone" ? PhoneCall : Building2;
                const isUpcoming = iv.status === "scheduled";
                const date = new Date(iv.scheduledAt);

                return (
                  <div key={iv.id} className="glass-card p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <div className="shrink-0 text-center w-16">
                        <div className="bg-gradient-to-b from-sky-400 to-indigo-500 text-white rounded-2xl px-3 py-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                            {date.toLocaleDateString("en-US", { month: "short" })}
                          </div>
                          <div className="text-2xl font-black leading-none">
                            {date.getDate()}
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1.5">
                          {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1.5 text-sm font-bold text-on-surface capitalize">
                            <TypeIcon className="w-4 h-4 text-sky-500" />
                            {iv.type} Interview
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                            isUpcoming ? "bg-sky-50 text-sky-600" :
                            iv.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                            "bg-red-50 text-red-500"
                          }`}>
                            {iv.status}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5" /> {iv.duration} min
                          </span>
                        </div>

                        {iv.meetingLink && (
                          <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-sky-500 hover:underline flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" /> {iv.meetingLink}
                          </a>
                        )}

                        {iv.notes && (
                          <div className="mt-2 bg-white/40 border border-white/60 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Notes
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed">{iv.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Full profile tab */}
      {activeTab === "profile" && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">

            {profile.bio && (
              <div className="glass-card p-6 space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">About</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            <div className="glass-card p-6 space-y-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skills</h3>
              <div className="space-y-3">
                {profile.skills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{skill.level}</span>
                      <span className="text-[10px] text-slate-400">{skill.yearsOfExperience}yr</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {profile.languages && profile.languages.length > 0 && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Languages</h3>
                {profile.languages.map((lang) => (
                  <div key={lang.name} className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">{lang.name}</span>
                    <span className="text-xs text-slate-400 font-medium">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            )}

            {profile.certifications && profile.certifications.length > 0 && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-3.5 h-3.5" /> Certifications
                </h3>
                {profile.certifications.map((cert) => (
                  <div key={cert.name} className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-700">{cert.name}</p>
                    <p className="text-xs text-slate-400">{cert.issuer} · {new Date(cert.issueDate).getFullYear()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">

            <div className="glass-card p-6 space-y-5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" /> Work Experience
              </h3>
              {profile.experience.length === 0 ? (
                <p className="text-sm text-slate-400">No experience listed.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-100" />
                  <div className="space-y-6">
                    {profile.experience.map((exp, i) => (
                      <div key={i} className="flex gap-5 relative">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 z-10 shadow-sm">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="font-bold text-slate-800">{exp.role}</p>
                          <p className="text-sm text-sky-600 font-semibold">{exp.company}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {exp.startDate && exp.endDate
                              ? `${exp.startDate} – ${exp.isCurrent ? "Present" : exp.endDate}`
                              : exp.isCurrent ? "Current" : ""}
                          </p>
                          {exp.description && (
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{exp.description}</p>
                          )}
                          {exp.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {exp.technologies.map((t) => (
                                <span key={t} className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card p-6 space-y-5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5" /> Education
              </h3>
              {profile.education.length === 0 ? (
                <p className="text-sm text-slate-400">No education listed.</p>
              ) : (
                <div className="space-y-4">
                  {profile.education.map((edu, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{edu.degree} in {edu.fieldOfStudy}</p>
                        <p className="text-sm text-sky-600 font-semibold">{edu.institution}</p>
                        {edu.startYear > 0 && (
                          <p className="text-xs text-slate-400">{edu.startYear} – {edu.endYear > 0 ? edu.endYear : "Present"}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {profile.projects && profile.projects.length > 0 && (
              <div className="glass-card p-6 space-y-5">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5" /> Projects
                </h3>
                <div className="space-y-4">
                  {profile.projects.map((proj, i) => (
                    <div key={i} className="border border-white/60 rounded-2xl p-4 bg-white/30 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-800">{proj.name}</p>
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noopener noreferrer"
                            className="text-sky-500 hover:text-sky-600 transition-colors shrink-0">
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{proj.description}</p>
                      {proj.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {proj.technologies.map((t) => (
                            <span key={t} className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "profile" && !profile && (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">No profile data available</p>
        </div>
      )}
    </div>
  );
}
