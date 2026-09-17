"use client";

import { useEffect, useState } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Zap, 
  Database, 
  GraduationCap, 
  Upload, 
  Save,
  Activity,
  CheckCircle2,
  ChevronRight,
  Plus
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { TalentProfile } from "@/lib/types";
import { getTalentProfileFullName } from "@/lib/types";

export default function ApplicantProfilePage() {
  const { token, updateUser } = useAuth();
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState("Your profile is ready.");

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const { profile: p } = await api.profiles.get(token);
        setProfile(p);
      } catch (err: any) {
        console.error("Failed to fetch profile:", err?.message || err);
        setStatus(err?.message || "No profile found. Upload a resume to get started.");
      }
    };
    fetchProfile();
  }, [token]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !token) return;
    setIsParsing(true);
    setStatus("Extracting profile data...");

    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(bytes);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/profiles/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: file.type || "application/pdf", base64 }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Parsing failed");

      setProfile(data.profile);
      setStatus("Extraction complete. Review and save your profile.");
    } catch (err: any) {
      setStatus(`Extraction failed: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !token) return;
    setIsSaving(true);
    try {
      await api.profiles.save(profile, token);
      
      // Update the user object in AuthContext so the navbar reflects the new name
      updateUser({
        firstName: profile.firstName,
        lastName: profile.lastName
      });

      setStatus("Profile saved successfully.");
    } catch (err) {
      setStatus("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Profile</h1>
          <p className="text-slate-500">Manage your profile and professional presence.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || !profile}
          className="px-8 py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-[24px] font-bold shadow-lg shadow-sky-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Profile Card & Upload (Column 1-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-8 text-center relative overflow-hidden">
            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-xl shadow-sky-100">
              {profile ? profile.firstName[0] : "?"}
            </div>
            <h2 className="text-2xl font-display font-bold text-on-surface">
              {profile ? getTalentProfileFullName(profile) : "New Profile"}
            </h2>
            <p className="text-sky-600 font-semibold text-sm">{profile?.headline || "Upload your resume to get started"}</p>
          </div>

          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
            className={`glass-card p-8 text-center border-2 border-dashed transition-all relative overflow-hidden group ${
              isDragging ? "border-sky-400 bg-sky-50/50" : "border-white/60 hover:border-sky-200"
            }`}
          >
            {isParsing && <div className="laser-line animate-scan" />}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-widest">Upload Resume</h3>
                <p className="text-slate-400 text-[10px] mt-1">Drop resume to extract your information.</p>
              </div>
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={(e) => handleFileUpload(e.target.files)}
                accept=".pdf,.txt"
              />
            </div>
          </div>

          <div className="glass-card p-6 border-sky-100 bg-sky-50/20 flex items-center gap-3">
            <Activity className="w-5 h-5 text-sky-500" />
            <p className="text-xs text-slate-600 font-medium uppercase tracking-tight">{status}</p>
          </div>
        </div>

        {/* Right: Data Layers (Column 5-12) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-8 space-y-8">
            <Section icon={User} title="User Info">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataField icon={Mail} label="Email" value={profile?.email} />
                <DataField icon={Phone} label="Phone" value={profile?.phone} />
                <DataField icon={MapPin} label="Location" value={profile?.location} />
                <DataField icon={Globe} label="Headline" value={profile?.headline} />
              </div>
            </Section>

            <Section icon={Zap} title="Skills">
              <div className="flex flex-wrap gap-2">
                {profile?.skills.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold shadow-sm">
                    {s.name} • {s.level}
                  </span>
                ))}
                {!profile?.skills.length && <p className="text-xs text-slate-400 italic">No skills extracted yet.</p>}
              </div>
            </Section>

            <Section icon={Database} title="Experience">
              <div className="space-y-4">
                {profile?.experience.map((exp, i) => (
                  <div key={i} className="p-4 bg-white/30 border border-white/60 rounded-2xl">
                    <h4 className="font-bold text-on-surface text-sm">{exp.role}</h4>
                    <p className="text-xs text-indigo-600 font-semibold mb-2">{exp.company}</p>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{exp.description}</p>
                  </div>
                ))}
                {!profile?.experience.length && <p className="text-xs text-slate-400 italic">No experience found.</p>}
              </div>
            </Section>

            <Section icon={GraduationCap} title="Education">
              <div className="space-y-3">
                {profile?.education.map((edu, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white/30 border border-white/60 rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">{edu.degree}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{edu.institution}</p>
                    </div>
                    <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">{edu.startYear} - {edu.endYear}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <Icon className="w-3.5 h-3.5" /> {title}
      </div>
      {children}
    </div>
  );
}

function DataField({ icon: Icon, label, value }: any) {
  return (
    <div className="p-4 bg-white/30 border border-white/60 rounded-2xl flex items-center gap-3">
      <div className="p-2 rounded-lg bg-white shadow-sm">
        <Icon className="w-4 h-4 text-sky-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
        <p className="text-sm font-semibold text-on-surface truncate">{value || "Not provided"}</p>
      </div>
    </div>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
