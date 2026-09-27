"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  AlertCircle, 
  CheckCircle, 
  Trophy, 
  Info, 
  CheckCircle2, 
  Zap, 
  ListChecks,
  FileText,
  Star,
  Clock,
  DollarSign,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { checkProfileCompleteness } from "@/lib/profile";
import { Modal, Badge } from "@/components/ui";

interface Job {
  id: string;
  title: string;
  summary: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minimumYearsExperience: number;
  educationLevel?: string;
  location?: string;
  dealbreakers?: string[];
  status: string;
  proofHire: {
    enabled: boolean;
    mode: "required" | "optional";
    challengeId?: string;
    proofWeight?: number;
  };
}

interface TalentProfile {
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio?: string;
  location: string;
  skills: { name: string; level: "Beginner" | "Intermediate" | "Advanced" | "Expert"; yearsOfExperience: number }[];
  experience: { company: string; role: string; startDate: string; endDate: string; description: string; technologies: string[]; isCurrent: boolean }[];
  education: { institution: string; degree: string; fieldOfStudy: string; startYear: number; endYear: number }[];
  projects: { name: string; description: string; technologies: string[]; role: string; startDate: string; endDate: string }[];
  availability: { status: "Available" | "Open to Opportunities" | "Not Available"; type: "Full-time" | "Part-time" | "Contract" };
  phone?: string;
  source: "umurava_profile" | "resume_upload" | "spreadsheet_row";
  resumeUploaded?: boolean;
  resumeFileName?: string;
  resumeUploadedAt?: string;
}

export default function JobDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { token } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");
  const [proofSubmission, setProofSubmission] = useState<{ evaluation?: { score: number; passed: boolean } } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const completeness = checkProfileCompleteness(profile);
  const resumeReady = profile?.resumeUploaded === true;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { job: jobData } = await api.jobs.get(jobId);
        setJob(jobData);

        if (token) {
          try {
            const { applications } = await api.applications.list(token);
            const applied = applications.some((a: { jobId: string }) => a.jobId === jobId);
            setHasApplied(applied);

            if (applied) {
              const myApp = applications.find((a: { jobId: string }) => a.jobId === jobId);
              if (myApp?.profile) {
                setProfile(myApp.profile);
              }
            }
          } catch {
            console.log("Not logged in or no applications");
          }

          try {
            const { profile: savedProfile } = await api.profiles.get(token);
            setProfile(savedProfile);
          } catch {
            console.log("No profile found");
          }

          try {
            const { submission } = await api.proofhire.getSubmission(jobId, token);
            setProofSubmission(submission);
          } catch {
            setProofSubmission(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch job:", err);
        setError("Failed to load job details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [jobId, token]);

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const { profile: savedProfile } = await api.profiles.get(token);
      setProfile(savedProfile);
    } catch {
      console.log("No profile found");
    }
  };

  const handleResumeUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !token) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      setError("Resume too large — please upload a file under 5MB.");
      return;
    }
    setIsUploadingResume(true);
    setError("");
    try {
      const bytes = await file.arrayBuffer();
      let binary = "";
      const chunk = new Uint8Array(bytes);
      for (let i = 0; i < chunk.length; i++) binary += String.fromCharCode(chunk[i]);
      const base64 = btoa(binary);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/profiles/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: file.type || "application/pdf", base64 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Parsing failed");
      const stamped: TalentProfile = {
        ...data.profile,
        resumeUploaded: true,
        resumeFileName: file.name,
        resumeUploadedAt: new Date().toISOString(),
      };
      const { profile: saved } = await api.profiles.save(stamped, token);
      setProfile(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload resume");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleApply = async () => {
    if (!token || !profile) {
      router.push("/applicant/profile");
      return;
    }

    const local = checkProfileCompleteness(profile);
    if (!local.complete || !resumeReady) {
      setWizardStep(!local.complete ? 0 : 1);
      return;
    }

    setIsApplying(true);
    setError("");

    try {
      await api.applications.create({ jobId, profile }, token);
      setHasApplied(true);
      setWizardStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-primary">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-on-surface mb-4">Job details not found</p>
        <Link href="/applicant/jobs" className="btn-secondary">Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Link
            href="/applicant/jobs"
            className="w-10 h-10 rounded-xl bg-white/40 backdrop-blur-md flex items-center justify-center text-on-surface-variant hover:text-primary transition-all border border-white/40 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center text-white shadow-lg">
              <Info className="w-5 h-5" />
            </div>
            <h1 className="font-display text-3xl font-bold text-primary tracking-tight">Job Details</h1>
          </div>
        </div>
      </div>

      {/* 40/60 Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column (40%) */}
        <div className="md:col-span-5 flex flex-col gap-6">
          {/* Skills & Requirements Card */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <ListChecks className="w-5 h-5" />
                Skills & Requirements
              </h2>
              <span className="text-xs font-bold text-secondary-container bg-secondary/10 px-2 py-1 rounded">
                ID: {job.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-white/40 border border-white/60 rounded-full text-xs font-medium text-on-surface-variant"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Preferred Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.preferredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-xs font-medium text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/30">
              <div className="flex items-center gap-3 p-3 bg-white/20 rounded-2xl border border-white/30">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <Briefcase className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</p>
                  <p className="text-sm font-semibold text-on-surface">{job.minimumYearsExperience}+ Years Required</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Card */}
          {job.proofHire?.enabled && (
            <div className="glass-panel p-6 rounded-3xl border-secondary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Skill Assessment</h3>
                  <p className="text-xs text-on-surface-variant">
                    {job.proofHire.mode === "required" ? "Required to Apply" : "Optional Enhancement"}
                  </p>
                </div>
              </div>

              {proofSubmission?.evaluation ? (
                <div className={`flex items-center gap-3 p-4 rounded-2xl mb-4 ${proofSubmission.evaluation.passed ? "bg-green-500/10 border border-green-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                  {proofSubmission.evaluation.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Current Score</p>
                    <p className={`text-lg font-bold ${proofSubmission.evaluation.passed ? "text-green-700" : "text-amber-700"}`}>
                      {proofSubmission.evaluation.score}% {proofSubmission.evaluation.passed ? "(Passed)" : "(Retry Recommended)"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                  {job.proofHire.mode === "required"
                    ? "This role requires a passed assessment before your application can be completed."
                    : "This role offers an optional assessment to improve your ranking."}
                </p>
              )}

              <Link
                href={`/proofhire/applicant/jobs/${jobId}`}
                className="w-full btn-secondary flex items-center justify-center gap-2 py-4"
              >
                <ExternalLink className="w-4 h-4" />
                Open Assessment
              </Link>
            </div>
          )}
        </div>

        {/* Right Column (60%) */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <div className="glass-panel p-8 rounded-3xl flex-grow flex flex-col gap-8">
            <div>
              <span className="text-[10px] font-bold text-primary-container bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-3 inline-block uppercase tracking-widest">
                Job Overview
              </span>
              <h2 className="font-display text-4xl font-bold text-on-surface mb-4">
                {job.title}
              </h2>
              <div className="flex flex-wrap gap-6 text-on-surface-variant font-medium text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {job.location || "Remote"}
                </div>
                {job.educationLevel && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    {job.educationLevel}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Full-time
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

            <section className="space-y-4">
              <h4 className="text-lg font-bold text-primary flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Job Description
              </h4>
              <p className="text-on-surface-variant leading-relaxed">
                {job.summary}
              </p>
            </section>

            {job.dealbreakers && job.dealbreakers.length > 0 && (
              <section className="space-y-4">
                <h4 className="text-lg font-bold text-error flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Key Requirements
                </h4>
                <ul className="grid grid-cols-1 gap-3">
                  {job.dealbreakers.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 p-4 bg-error/5 rounded-2xl border border-error/10">
                      <div className="w-5 h-5 rounded-full bg-error/10 flex items-center justify-center mt-0.5">
                        <span className="text-error font-bold text-[10px]">!</span>
                      </div>
                      <span className="text-on-surface-variant text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-4">
              <h4 className="text-lg font-bold text-secondary flex items-center gap-2">
                <Star className="w-5 h-5" />
                Benefits & Perks
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 glass-panel rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">Remote-First Culture</span>
                </div>
                <div className="p-4 glass-panel rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-sm font-semibold">Competitive Salary</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 w-full p-8 flex justify-center pointer-events-none z-50">
        <div className="pointer-events-auto max-w-4xl w-full flex justify-center">
          {hasApplied ? (
            <div className="glass-panel px-8 py-4 rounded-full flex items-center gap-4 shadow-2xl border-green-500/30">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-on-surface">Application Submitted</p>
                <Link href="/applicant/applications" className="text-xs text-primary hover:underline">View Application Status</Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {error && (
                <div className="px-6 py-2 bg-error-container text-error text-sm rounded-full shadow-lg border border-error/20">
                  {error}
                </div>
              )}
              {!profile ? (
                <Link
                  href="/applicant/profile"
                  className="btn-primary group relative flex items-center gap-4 px-10 py-4 rounded-full text-white font-bold shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  <span className="relative flex items-center gap-2">
                    Complete Your Profile
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => { setError(""); setWizardStep(0); setWizardOpen(true); }}
                  className="btn-primary group relative flex items-center gap-4 px-10 py-4 rounded-full text-white font-bold shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  <span className="relative flex items-center gap-2">
                    Start Application
                    <Zap className="w-5 h-5" />
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {job && (
        <ApplyWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          step={wizardStep}
          setStep={setWizardStep}
          job={job}
          profile={profile}
          completenessMissing={completeness.missing}
          profileComplete={completeness.complete}
          resumeReady={resumeReady}
          isApplying={isApplying}
          isUploadingResume={isUploadingResume}
          error={error}
          proofPassed={proofSubmission?.evaluation?.passed ?? false}
          onUpload={handleResumeUpload}
          onRefreshProfile={refreshProfile}
          onSubmit={handleApply}
        />
      )}
    </div>
  );
}

const WIZARD_STEPS = ["Profile", "Resume", "Review", "Done"] as const;

function ApplyWizard({
  open,
  onClose,
  step,
  setStep,
  job,
  profile,
  completenessMissing,
  profileComplete,
  resumeReady,
  isApplying,
  isUploadingResume,
  error,
  proofPassed,
  onUpload,
  onRefreshProfile,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  step: number;
  setStep: (n: number) => void;
  job: Job;
  profile: TalentProfile | null;
  completenessMissing: string[];
  profileComplete: boolean;
  resumeReady: boolean;
  isApplying: boolean;
  isUploadingResume: boolean;
  error: string;
  proofPassed: boolean;
  onUpload: (files: FileList | null) => void;
  onRefreshProfile: () => void;
  onSubmit: () => void;
}) {
  const matchedSkills = job.requiredSkills.filter((s) =>
    profile?.skills.some((ps) => ps.name.toLowerCase() === s.toLowerCase()),
  );
  const assessmentRequired = job.proofHire?.enabled && job.proofHire.mode === "required";

  return (
    <Modal open={open} onClose={onClose} title="Apply for this role" wide>
      <ol aria-label="Application steps" className="mb-6 flex items-center gap-2">
        {WIZARD_STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${done ? "bg-emerald-500 text-white" : current ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white" : "bg-slate-100 text-slate-400"}`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={`text-xs font-bold ${current ? "text-on-surface" : "text-slate-400"}`}>{label}</span>
              {i < WIZARD_STEPS.length - 1 && <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />}
              <span className="sr-only">{label}: {done ? "done" : current ? "current" : "upcoming"}</span>
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {step === 0 && (
        <div>
          <h3 className="font-display text-lg font-bold text-on-surface">Step 1 — Your profile</h3>
          <p className="mt-1 text-sm text-slate-500">Recruiters see this profile. Every item below is required.</p>
          {profileComplete ? (
            <p className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Profile complete — {profile?.skills.length} skills, {profile?.experience.length} experience entries.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {completenessMissing.map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-sm font-semibold text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/applicant/profile" className="btn-secondary rounded-xl px-5 py-2.5 text-sm">
              {profileComplete ? "Review profile" : "Complete profile"}
            </Link>
            <button onClick={onRefreshProfile} className="btn-ghost rounded-xl px-4 py-2.5 text-sm">
              Re-check
            </button>
            <button
              onClick={() => setStep(1)}
              disabled={!profileComplete}
              className="btn-primary rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
            >
              Continue to resume
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h3 className="font-display text-lg font-bold text-on-surface">Step 2 — Resume</h3>
          <p className="mt-1 text-sm text-slate-500">A parsed resume is required. Upload a PDF (max 5MB).</p>
          {resumeReady ? (
            <p className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-bold text-emerald-700">
              <FileText className="h-5 w-5" aria-hidden="true" /> {profile?.resumeFileName ?? "Resume attached"}
              {profile?.resumeUploadedAt && <span className="font-medium text-emerald-600">· {new Date(profile.resumeUploadedAt).toLocaleDateString()}</span>}
            </p>
          ) : (
            <label className="mt-4 block cursor-pointer rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/40 px-6 py-8 text-center transition-colors hover:border-sky-400 hover:bg-sky-50/70">
              <span className="sr-only">Upload resume PDF</span>
              <input type="file" accept=".pdf,.txt,application/pdf,text/plain" className="hidden" disabled={isUploadingResume} onChange={(e) => onUpload(e.target.files)} />
              {isUploadingResume ? (
                <span className="inline-flex items-center gap-2 text-sm font-bold text-sky-700">
                  <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500" /> Parsing resume…
                </span>
              ) : (
                <span className="text-sm font-bold text-sky-700">Click to upload your resume</span>
              )}
            </label>
          )}
          <div className="mt-5 flex gap-3">
            <button onClick={() => setStep(0)} className="btn-ghost rounded-xl px-4 py-2.5 text-sm">Back</button>
            <button
              onClick={() => setStep(2)}
              disabled={!resumeReady}
              className="btn-primary rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
            >
              Continue to review
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="font-display text-lg font-bold text-on-surface">Step 3 — Review</h3>
          <p className="mt-1 text-sm text-slate-500">This is what the recruiter receives.</p>
          <div className="glass-panel mt-4 space-y-3 p-5 text-sm">
            <p><strong>{profile?.firstName} {profile?.lastName}</strong> <span className="text-slate-500">· {profile?.headline} · {profile?.location}</span></p>
            <p className="flex flex-wrap gap-1.5">
              {profile?.skills.slice(0, 8).map((s) => (
                <Badge key={s.name} tone={matchedSkills.some((m) => m.toLowerCase() === s.name.toLowerCase()) ? "success" : "default"}>{s.name}</Badge>
              ))}
            </p>
            <p className="text-slate-600">
              <strong className="text-emerald-700">{matchedSkills.length}/{job.requiredSkills.length}</strong> required skills matched
              {matchedSkills.length < job.requiredSkills.length && (
                <span className="text-slate-500"> · missing: {job.requiredSkills.filter((s) => !matchedSkills.some((m) => m.toLowerCase() === s.toLowerCase())).join(", ")}</span>
              )}
            </p>
            <p className="text-slate-600">Resume: <strong>{profile?.resumeFileName ?? "attached"}</strong></p>
            {assessmentRequired && (
              <p className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2 text-indigo-800">
                {proofPassed ? "Skill assessment passed — attached to your application." : "This role has a required skill assessment — you can complete it right after applying."}
              </p>
            )}
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost rounded-xl px-4 py-2.5 text-sm">Back</button>
            <button onClick={onSubmit} disabled={isApplying} className="btn-primary rounded-xl px-6 py-2.5 text-sm disabled:opacity-50">
              {isApplying ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-display text-xl font-bold text-on-surface">Application submitted</h3>
          {assessmentRequired && !proofPassed ? (
            <div className="mt-3">
              <p className="text-sm text-slate-500">One last step — pass the skill assessment to strengthen your ranking.</p>
              <Link href={`/proofhire/applicant/jobs/${job.id}`} className="btn-primary mt-4 inline-flex rounded-xl px-6 py-3 text-sm">
                Start assessment <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <Link href="/applicant/applications" className="btn-secondary mt-4 inline-flex rounded-xl px-6 py-3 text-sm">
              Track application status
            </Link>
          )}
        </div>
      )}
    </Modal>
  );
}