"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Dna, 
  ChevronRight, 
  FileCode, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft,
  Search,
  Zap,
  Layout,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function MyChallengesPage() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  useEffect(() => {
    if (!token) return;
    api.proofhire.listMySubmissions(token)
      .then(res => {
        setSubmissions(res.submissions);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/applicant" className="p-2 hover:bg-white/40 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </Link>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Assessment History</h1>
            <p className="text-slate-500 text-lg">Review your technical assessment performance.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Submissions List (Column 1-5) */}
        <div className="lg:col-span-5 space-y-4">
          {submissions.length === 0 ? (
            <div className="glass-card p-12 text-center bg-white/40 border-dashed border-2 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <Dna className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-medium">No missions completed yet.</p>
              <Link href="/applicant/jobs" className="text-indigo-600 font-bold text-sm hover:underline">
                Explore jobs to start a challenge.
              </Link>
            </div>
          ) : (
            submissions.map((sub) => (
              <div 
                key={sub.id} 
                onClick={() => setSelectedSubmission(sub)}
                className={`glass-card p-6 cursor-pointer transition-all border-l-4 ${
                  selectedSubmission?.id === sub.id ? "border-l-indigo-500 bg-white shadow-lg" : "border-l-transparent border-white/60 hover:border-l-indigo-300 bg-white/40"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                    sub.evaluation?.passed ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  }`}>
                    {sub.evaluation?.passed ? "Passed" : "Failed"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(sub.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-on-surface group-hover:text-indigo-600 transition-colors mb-1">
                  {sub.challengeTitle}
                </h3>
                <p className="text-xs text-slate-400 mb-4">{sub.jobTitle}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-xs">
                      {sub.evaluation?.score || 0}%
                    </div>
                    <span className="text-xs font-medium text-slate-500">AI Score</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${selectedSubmission?.id === sub.id ? "rotate-90 text-indigo-500" : ""}`} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detailed Review (Column 6-12) */}
        <div className="lg:col-span-7">
          {selectedSubmission ? (
            <div className="glass-card p-8 min-h-[300px] space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-display font-bold text-on-surface">{selectedSubmission.challengeTitle}</h2>
                  <p className="text-sm text-indigo-600 font-semibold">{selectedSubmission.jobTitle}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <BookOpen className="w-4 h-4" /> Assessment Brief
                </div>
                <div className="p-6 bg-indigo-50/30 rounded-[32px] border border-indigo-100/50">
                  <p className="text-sm text-slate-600 leading-relaxed italic">{selectedSubmission.challengeInstructions}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center h-full flex flex-col justify-center items-center space-y-4 bg-white/20">
              <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center text-slate-300">
                <Layout className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-400">Assessment Details</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm leading-relaxed">
                Select a mission from your history to view detailed technical diagnostics and study the AI-extracted feedback.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
