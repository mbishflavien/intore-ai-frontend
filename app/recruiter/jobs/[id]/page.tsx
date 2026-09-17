"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Rocket, 
  XCircle, 
  Target,
  Briefcase,
  Calendar,
  MapPin,
  Award,
  Users,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

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
  proofHire: {
    enabled: boolean;
    mode: "required" | "optional";
    challengeId?: string;
  };
  status: string;
  createdAt: string;
}

export default function RecruiterJobDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { token } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { job: jobData } = await api.jobs.get(jobId);
        setJob(jobData);
      } catch (err) {
        console.error("Failed to fetch job:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handlePublish = async () => {
    if (!job || !token) return;
    setIsUpdating(true);
    try {
      const { job: updatedJob } = await api.jobs.publish(job.id, token);
      setJob(updatedJob);
      setMessage({ text: "Job published successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to publish job", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = async () => {
    if (!job || !token) return;
    setIsUpdating(true);
    try {
      const { job: updatedJob } = await api.jobs.close(job.id, token);
      setJob(updatedJob);
      setMessage({ text: "Job closed successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to close job", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!job || !token) return;
    if (!confirm("Are you sure you want to delete this job?")) return;

    setIsUpdating(true);
    try {
      await api.jobs.delete(job.id, token);
      router.push("/recruiter/jobs");
    } catch (err) {
      setMessage({ text: "Failed to delete job", type: "error" });
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20 glass-card">
        <p className="text-slate-500 mb-4">Job not found</p>
        <Link href="/recruiter/jobs" className="text-sky-500 font-bold hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
      </div>
    );
  }

  const statusStyles: any = {
    published: { color: "text-green-500 bg-green-50", icon: CheckCircle2, label: "Active" },
    draft: { color: "text-sky-500 bg-sky-50", icon: Clock, label: "Drafting" },
    closed: { color: "text-slate-400 bg-slate-50", icon: AlertCircle, label: "Concluded" },
  };

  const status = statusStyles[job.status] || statusStyles.draft;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Back Link */}
      <Link
        href="/recruiter/jobs"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-sky-500 transition-colors font-bold text-sm uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Workspace
      </Link>

      {/* Message Toast (simplified) */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm backdrop-blur-md ${
          message.type === "success" ? "bg-green-50/50 border-green-200 text-green-700" : "bg-red-50/50 border-red-200 text-red-700"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-black/5 rounded-lg transition-colors">
            <XCircle className="w-4 h-4 opacity-50" />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="space-y-4">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.color}`}>
            <status.icon className="w-3 h-3" /> {status.label}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-on-surface leading-tight">
            {job.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-slate-400 text-sm font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Created {new Date(job.createdAt).toLocaleDateString()}
            </div>
            {job.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {job.location}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              {job.minimumYearsExperience}+ Years
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/recruiter/jobs/${job.id}/applicants`}
            className="px-6 py-3 bg-white/40 border border-white/60 text-slate-700 font-bold rounded-2xl backdrop-blur-md shadow-sm hover:bg-white/60 transition-all flex items-center gap-2"
          >
            <Users className="w-5 h-5 text-sky-500" /> View Applicants
          </Link>
          
          {job.status === "draft" && (
            <button
              onClick={handlePublish}
              disabled={isUpdating}
              className="px-6 py-3 bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Rocket className="w-5 h-5" /> {isUpdating ? "Publishing..." : "Publish Job"}
            </button>
          )}

          {job.status === "published" && (
            <button
              onClick={handleClose}
              disabled={isUpdating}
              className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" /> {isUpdating ? "Closing..." : "Close Job"}
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isUpdating}
            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
            title="Delete Job"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary */}
          <section className="glass-card p-8">
            <h2 className="text-xl font-display font-black text-on-surface mb-6 flex items-center gap-2">
              <div className="w-2 h-6 bg-sky-400 rounded-full" /> Job Description
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed text-lg">
                {job.summary}
              </p>
            </div>
          </section>

          {/* Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="glass-card p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold border border-sky-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="glass-card p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Preferred Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.preferredSkills.length > 0 ? (
                  job.preferredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold border border-slate-100"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic">None specified</span>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {/* Assessment Card */}
          <section className={`glass-card p-6 border-l-4 ${job.proofHire?.enabled ? "border-l-sky-400" : "border-l-slate-200"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${job.proofHire?.enabled ? "bg-sky-50 text-sky-500" : "bg-slate-50 text-slate-400"}`}>
                <Target className="w-6 h-6" />
              </div>
              <Link 
                href="/proofhire/recruiter" 
                className="text-[10px] font-bold text-sky-500 uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Config <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <h3 className="font-display font-black text-on-surface mb-2">Talent Assessment</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {job.proofHire?.enabled
                ? `System initialized with a ${job.proofHire.mode} assessment protocol.`
                : "Assessment protocols are currently disabled for this mission."}
            </p>
            {job.proofHire?.challengeId && (
              <div className="mt-4 pt-4 border-t border-white/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol ID</span>
                <p className="font-mono text-[10px] text-sky-600 mt-1 truncate">{job.proofHire.challengeId}</p>
              </div>
            )}
          </section>

          {/* Requirements Card */}
          <section className="glass-card p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Mission Requirements</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</p>
                  <p className="text-sm font-bold text-on-surface">{job.minimumYearsExperience}+ Years</p>
                </div>
              </div>

              {job.educationLevel && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Education</p>
                    <p className="text-sm font-bold text-on-surface">{job.educationLevel}</p>
                  </div>
                </div>
              )}
            </div>

            {job.dealbreakers && job.dealbreakers.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/60">
                <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" /> Dealbreakers
                </h4>
                <ul className="space-y-2">
                  {job.dealbreakers.map((item, i) => (
                    <li key={i} className="text-xs text-red-600/70 font-medium flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
