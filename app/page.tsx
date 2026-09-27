"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push(user.role === "recruiter" ? "/recruiter" : "/applicant");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-aura-gradient">
        <div className="glass-card flex items-center gap-3 p-8">
          <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500" />
          <span className="text-sm font-semibold text-slate-600">Loading IntoreAI…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-aura-gradient p-5">
      <div className="glass-card w-full max-w-[500px] p-12 text-center">
        <span className="mx-auto mb-6 inline-flex rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 p-3 text-white shadow-lg shadow-sky-200">
          <Sparkles className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text font-display text-4xl font-black tracking-tight text-transparent">
          IntoreAI
        </h1>
        <p className="mb-8 mt-4 text-base text-slate-500">
          AI-powered talent screening platform for recruiters and job seekers
        </p>

        <div className="flex flex-col gap-4">
          <Link href="/login" className="btn-primary w-full rounded-xl py-4 text-base">
            Sign In <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/register" className="btn-secondary w-full rounded-xl border-2 border-primary/30 py-4 text-base text-primary">
            <UserPlus className="h-4 w-4" aria-hidden="true" /> Create Account
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-400">
          Select &ldquo;Job Seeker&rdquo; or &ldquo;Recruiter&rdquo; when registering
        </p>
      </div>
    </div>
  );
}
