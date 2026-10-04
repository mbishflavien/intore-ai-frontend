"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Download, KeyRound, LogOut, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Setup = { qrDataUrl: string; secret: string };

const inputClass =
  "w-full rounded-2xl border border-white/60 bg-white/50 px-4 py-3 font-medium outline-none ring-sky-500/10 transition-all placeholder:text-slate-400 focus:ring-4";

/** Two-factor authentication (TOTP + backup codes) and session management. */
export function SecuritySettings() {
  const { updateUser } = useAuth();
  const [status, setStatus] = useState<{ enabled: boolean; backupCodesRemaining: number } | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [mode, setMode] = useState<"idle" | "disable" | "regenerate">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      setStatus(await api.auth.mfa.status());
    } catch {
      setError("Couldn't load your security settings.");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (err) {
      setError((err as ApiError).message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const startSetup = () =>
    run(async () => {
      setBackupCodes(null);
      setSetup(await api.auth.mfa.setup());
      setCode("");
    });

  const confirmSetup = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await api.auth.mfa.enable(code.trim());
      setBackupCodes(result.backupCodes);
      setSetup(null);
      setCode("");
      updateUser({ mfaEnabled: true });
      await refresh();
    });
  };

  const regenerate = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const result = await api.auth.mfa.regenerateBackupCodes(code.trim());
      setBackupCodes(result.backupCodes);
      setMode("idle");
      setCode("");
      await refresh();
    });
  };

  const disable = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await api.auth.mfa.disable(password, code.trim());
      setMode("idle");
      setCode("");
      setPassword("");
      setBackupCodes(null);
      updateUser({ mfaEnabled: false });
      setNotice("Two-factor authentication is off.");
      await refresh();
    });
  };

  const signOutEverywhere = () =>
    run(async () => {
      await api.auth.logoutAll();
      window.location.assign("/login");
    });

  const copyCodes = async () => {
    if (!backupCodes) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setNotice("Backup codes copied.");
    } catch {
      setNotice("Copy failed — select the codes and copy them manually.");
    }
  };

  const downloadCodes = () => {
    if (!backupCodes) return;
    const blob = new Blob([`IntoreAI backup codes\nEach code works once.\n\n${backupCodes.join("\n")}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "intoreai-backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Security</h1>
        <p className="mt-2 text-slate-500">Protect your account with a second sign-in step.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
      )}
      {notice && (
        <div role="status" className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>
      )}

      <section className="glass-card space-y-6 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className={`rounded-2xl p-3 ${status?.enabled ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
              {status?.enabled ? <ShieldCheck className="h-6 w-6" aria-hidden="true" /> : <Smartphone className="h-6 w-6" aria-hidden="true" />}
            </span>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Two-factor authentication</h2>
              <p className="mt-1 text-sm text-slate-500">
                {status === null
                  ? "Loading…"
                  : status.enabled
                    ? `On. ${status.backupCodesRemaining} backup code${status.backupCodesRemaining === 1 ? "" : "s"} left.`
                    : "Off. Use an authenticator app such as Google Authenticator, Microsoft Authenticator, 1Password or Authy."}
              </p>
            </div>
          </div>
          {status && !status.enabled && !setup && (
            <button type="button" onClick={startSetup} disabled={busy} className="btn-primary shrink-0 rounded-xl px-5 py-2.5 text-sm">
              Turn on
            </button>
          )}
        </div>

        {setup && (
          <form onSubmit={confirmSetup} className="grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-[auto,1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qrDataUrl} alt="QR code to add IntoreAI to your authenticator app" width={180} height={180} className="rounded-xl bg-white p-2" />
            <div className="space-y-4">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
                <li>Scan the QR code with your authenticator app.</li>
                <li>Enter the 6-digit code it shows to finish.</li>
              </ol>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Can&apos;t scan? Enter this key</p>
                <code className="mt-1 block break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-700">{setup.secret}</code>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">6-digit code</span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9 ]{6,7}"
                  maxLength={7}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                />
              </label>
              <div className="flex gap-3">
                <button type="submit" disabled={busy} className="btn-primary rounded-xl px-5 py-2.5 text-sm">Verify and turn on</button>
                <button type="button" onClick={() => setSetup(null)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          </form>
        )}

        {backupCodes && (
          <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <KeyRound className="h-5 w-5" aria-hidden="true" /> Save your backup codes
            </div>
            <p className="text-sm text-amber-800">
              Each code signs you in once if you lose your phone. They won&apos;t be shown again — store them somewhere safe.
            </p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm text-slate-800 sm:grid-cols-5">
              {backupCodes.map((backupCode) => (
                <li key={backupCode} className="rounded-lg bg-white px-2 py-1.5 text-center">{backupCode}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={copyCodes} className="btn-secondary rounded-xl px-4 py-2 text-sm"><Copy className="h-4 w-4" aria-hidden="true" /> Copy</button>
              <button type="button" onClick={downloadCodes} className="btn-secondary rounded-xl px-4 py-2 text-sm"><Download className="h-4 w-4" aria-hidden="true" /> Download</button>
              <button type="button" onClick={() => setBackupCodes(null)} className="btn-ghost text-sm">I&apos;ve saved them</button>
            </div>
          </div>
        )}

        {status?.enabled && mode === "idle" && !backupCodes && (
          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
            <button type="button" onClick={() => { setMode("regenerate"); setCode(""); }} className="btn-secondary rounded-xl px-4 py-2 text-sm">
              <KeyRound className="h-4 w-4" aria-hidden="true" /> New backup codes
            </button>
            <button type="button" onClick={() => { setMode("disable"); setCode(""); }} className="btn-ghost text-sm text-red-600">
              <ShieldOff className="h-4 w-4" aria-hidden="true" /> Turn off
            </button>
          </div>
        )}

        {mode === "regenerate" && (
          <form onSubmit={regenerate} className="space-y-4 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-600">Enter a current code from your authenticator app. Your old backup codes will stop working.</p>
            <input className={inputClass} inputMode="numeric" autoComplete="one-time-code" required maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" aria-label="Authenticator code" />
            <div className="flex gap-3">
              <button type="submit" disabled={busy} className="btn-primary rounded-xl px-5 py-2.5 text-sm">Create new codes</button>
              <button type="button" onClick={() => setMode("idle")} className="btn-ghost text-sm">Cancel</button>
            </div>
          </form>
        )}

        {mode === "disable" && (
          <form onSubmit={disable} className="space-y-4 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-600">Confirm with your password and a code from your app (or a backup code).</p>
            <input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" />
            <input className={inputClass} autoComplete="one-time-code" required maxLength={20} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" aria-label="Authenticator or backup code" />
            <div className="flex gap-3">
              <button type="submit" disabled={busy} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Turn off 2FA</button>
              <button type="button" onClick={() => setMode("idle")} className="btn-ghost text-sm">Cancel</button>
            </div>
          </form>
        )}
      </section>

      <section className="glass-card flex flex-wrap items-center justify-between gap-4 p-8">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Sessions</h2>
          <p className="mt-1 text-sm text-slate-500">Sign out of IntoreAI on every device, including this one.</p>
        </div>
        <button type="button" onClick={signOutEverywhere} disabled={busy} className="btn-secondary rounded-xl px-4 py-2 text-sm">
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out everywhere
        </button>
      </section>
    </div>
  );
}
