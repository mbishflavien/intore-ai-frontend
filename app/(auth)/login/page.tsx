"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Users, Briefcase, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ApiError } from "@/lib/api";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/Turnstile";

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"applicant" | "recruiter">("applicant");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"password" | "otp">("password");
  const [code, setCode] = useState("");
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const goToDashboard = (signedInRole: string) => router.push(signedInRole === "recruiter" ? "/recruiter" : "/applicant");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaRequired && TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the security check below.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const outcome = await login(email, password, { role, captchaToken: captchaToken ?? undefined });
      if (outcome.status === "mfa") {
        setStep("otp");
        setPassword("");
        return;
      }
      goToDashboard(outcome.user.role);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.data?.captchaRequired) setCaptchaRequired(true);
      // CAPTCHA tokens are single-use: get a fresh challenge for the next attempt.
      setCaptchaToken(null);
      setCaptchaReset((n) => n + 1);
      setError(apiError.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const signedIn = await verifyOtp(code.trim(), role);
      goToDashboard(signedIn.role);
    } catch (err) {
      const apiError = err as ApiError;
      setCode("");
      if (apiError.data?.restart) {
        setStep("password");
        setError(apiError.message);
      } else {
        const left = apiError.data?.attemptsRemaining;
        setError(left !== undefined ? `${apiError.message} ${left} attempt${left === 1 ? "" : "s"} left.` : apiError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-aura-gradient p-6 relative overflow-hidden">
      {/* Decorative Nebula Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-400/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />

      <div className="w-full max-w-[440px] relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="mb-6">
            <span className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500 font-display">
              IntoreAI
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface mb-2">Login</h1>
          <p className="text-slate-500">Access the platform</p>
        </div>

        <div className="glass-card p-8 bg-white/60 backdrop-blur-3xl border-white/80 shadow-[0_40px_80px_rgba(56,189,248,0.08)]">
          {step === "otp" ? (
            <form onSubmit={handleOtp} className="space-y-6">
              <div className="flex flex-col items-center text-center gap-2">
                <span className="p-3 rounded-2xl bg-sky-500 text-white"><KeyRound className="w-5 h-5" aria-hidden="true" /></span>
                <h2 className="text-lg font-bold text-on-surface">Two-factor authentication</h2>
                <p className="text-sm text-slate-500">Enter the 6-digit code from your authenticator app, or one of your backup codes.</p>
              </div>
              {error && (
                <div role="alert" className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> {error}
                </div>
              )}
              <label className="block">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Authentication code</span>
                <input
                  type="text"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  maxLength={20}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-4 text-center text-xl tracking-[0.3em] focus:ring-4 ring-sky-500/10 outline-none transition-all placeholder:text-slate-300 font-semibold"
                />
              </label>
              <button
                type="submit"
                disabled={isLoading || code.trim().length < 6}
                className="w-full py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-[20px] font-bold shadow-xl shadow-sky-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Verify</span>}
              </button>
              <button type="button" onClick={() => { setStep("password"); setError(""); setCode(""); }} className="w-full text-sm font-semibold text-slate-500 hover:text-sky-500">
                Back to sign in
              </button>
            </form>
          ) : (
          <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <RoleCard 
              active={role === "applicant"} 
              onClick={() => setRole("applicant")}
              icon={Users}
              label="Applicant"
              desc="I am looking for jobs"
            />
            <RoleCard 
              active={role === "recruiter"} 
              onClick={() => setRole("recruiter")}
              icon={Briefcase}
              label="Recruiter"
              desc="I am hiring talent"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div role="alert" className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Email or username</span>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@visionary.ai"
                  className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-4 focus:ring-4 ring-sky-500/10 outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Password</span>
                <input 
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-4 focus:ring-4 ring-sky-500/10 outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </label>
            </div>

            {captchaRequired && <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-[20px] font-bold shadow-xl shadow-sky-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/60 text-center">
            <p className="text-sm text-slate-500">
              New to the Elite Talent Pool?{" "}
              <Link href="/register" className="text-sky-500 font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
          </>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-8">
          <Link href="/privacy" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-sky-500 transition-colors">Privacy</Link>
          <Link href="/terms" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-sky-500 transition-colors">Sovereign Terms</Link>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, icon: Icon, label, desc }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-[24px] border-2 cursor-pointer transition-all duration-300 text-center flex flex-col items-center gap-2 group ${
        active 
          ? "border-sky-400 bg-sky-50 shadow-lg shadow-sky-100" 
          : "border-white/60 bg-white/30 hover:border-sky-200"
      }`}
    >
      <div className={`p-3 rounded-2xl transition-colors ${active ? "bg-sky-500 text-white" : "bg-white text-slate-400 group-hover:text-sky-400"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap ${active ? "text-sky-600" : "text-slate-500"}`}>{label}</div>
        <div className="text-[10px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">{desc}</div>
      </div>
    </div>
  );
}