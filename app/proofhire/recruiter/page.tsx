"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  Dna, 
  FileText, 
  Search, 
  Zap, 
  ArrowLeft, 
  Upload, 
  Database, 
  CheckCircle2,
  AlertCircle,
  FileCode,
  Globe,
  Mail,
  Phone,
  User,
  History,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  X
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { 
  TalentProfile, 
  ApplicantData, 
  CreateProofChallengeInput, 
  ProofChallengeType,
  ProofChallenge
} from "@/lib/types";
import { getTalentProfileFullName } from "@/lib/types";

type Mode = "parse" | "challenges";

export default function TalentScanner() {
  const { token, user } = useAuth();
  const [mode, setMode] = useState<Mode>("parse");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedProfile, setParsedProfile] = useState<TalentProfile | null>(null);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [status, setStatus] = useState("Ready to parse resumes.");
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<TalentProfile[]>([]);

  // Challenge State
  const [challenges, setChallenges] = useState<ProofChallenge[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [isSavingChallenge, setIsSavingChallenge] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<CreateProofChallengeInput>({
    title: "",
    type: "coding",
    instructions: "",
    prompt: "",
    requiredSkills: [],
    testCases: [
      { title: "Correctness", description: "The solution should work as expected.", expectedPatterns: ["placeholder"], weight: 60 }
    ],
    rubric: {
      correctnessWeight: 60,
      qualityWeight: 20,
      completenessWeight: 20,
      minimumPassingScore: 60
    }
  });

  useEffect(() => {
    if (!token) return;
    
    if (user?.role !== "recruiter") {
      setStatus("Access denied. Recruiter role required.");
      return;
    }

    if (mode === "challenges") {
      Promise.all([api.proofhire.listChallenges(token), api.proofhire.templates()])
        .then(([challengeRes, templateRes]) => {
          setChallenges(challengeRes.challenges);
          setTemplates(templateRes.templates);
        })
        .catch(() => setStatus("Failed to load scanner resources."));
    }
  }, [token, mode]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !token) return;
    
    setIsParsing(true);
    setStatus("Parsing resume...");
    setParsingProgress(0);

    const interval = setInterval(() => {
      setParsingProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 200);

    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(bytes);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/ingest/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: file.type || "application/pdf", base64 }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Parsing failed");

      const profile = data.applicant;
      setParsedProfile(profile);
      setHistory(prev => [profile, ...prev.slice(0, 9)]);
      setStatus(`Resume parsed for ${getTalentProfileFullName(profile)}.`);
      setParsingProgress(100);
    } catch (err: any) {
      setStatus(`Parsing failed: ${err.message}`);
    } finally {
      clearInterval(interval);
      setIsParsing(false);
    }
  };

  const handleCreateChallenge = async () => {
    console.log("handleCreateChallenge called");
    console.log("editingChallenge:", editingChallenge);
    if (!token) return;
    setIsSavingChallenge(true);
    try {
      console.log("Making API call...");
      await api.proofhire.createChallenge(editingChallenge, token);
      const res = await api.proofhire.listChallenges(token);
      setChallenges(res.challenges);
      setIsCreatingChallenge(false);
      setStatus("Challenge created successfully.");
    } catch (err: any) {
      console.error("API Error:", err);
      setStatus(`Failed to create challenge: ${err.message}`);
    } finally {
      setIsSavingChallenge(false);
    }
  };

  const useTemplate = (template: any) => {
    setEditingChallenge({
      title: template.title,
      type: template.type,
      instructions: template.instructions || `Solve the ${template.title} challenge.`,
      prompt: template.prompt,
      starterCode: template.starterCode,
      starterQuery: template.starterQuery,
      requiredSkills: template.requiredSkills || [],
      testCases: template.testCases.map((tc: any) => ({
        title: tc.title,
        description: tc.description,
        expectedPatterns: tc.expectedPatterns,
        weight: tc.weight
      })),
      rubric: template.rubric
    });
    setIsCreatingChallenge(true);
  };

  const addTestCase = () => {
    setEditingChallenge(prev => ({
      ...prev,
      testCases: [...prev.testCases, { title: "", description: "", expectedPatterns: [], weight: 10 }]
    }));
  };

  const removeTestCase = (index: number) => {
    setEditingChallenge(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const updateTestCase = (index: number, field: string, value: any) => {
    setEditingChallenge(prev => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) => i === index ? { ...tc, [field]: value } : tc)
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/recruiter" className="p-2 hover:bg-white/40 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </Link>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Talent Scanner</h1>
            <p className="text-slate-500">Parse resumes and create challenges for candidates</p>
          </div>
        </div>

        <div className="flex bg-white/40 backdrop-blur-xl p-1 rounded-2xl border border-white/60 shadow-sm">
          <button 
            onClick={() => setMode("parse")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === "parse" ? "bg-white text-sky-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            Parse Resume
          </button>
          <button 
            onClick={() => setMode("challenges")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === "challenges" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            Challenges
          </button>
        </div>
      </div>

      {mode === "parse" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Upload & Status (Column 1-5) */}
          <div className="lg:col-span-5 space-y-6">
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
              className={`glass-card p-12 text-center border-2 border-dashed transition-all relative overflow-hidden group ${
                isDragging ? "border-sky-400 bg-sky-50/50" : "border-white/60 hover:border-sky-200"
              }`}
            >
              {isParsing && (
                <div className="laser-line animate-scan shadow-[0_0_15px_#38bdf8]" />
              )}
              
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${isParsing ? "bg-sky-500 text-white animate-pulse" : "bg-white text-sky-500 group-hover:scale-110"}`}>
                  <Upload className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-on-surface">Resume Parse</h3>
                  <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                    Drop PDF or TXT resumes here for deep-dive AI validation.
                  </p>
                </div>
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => handleFileUpload(e.target.files)}
                  accept=".pdf,.txt"
                />
              </div>
            </div>

            <div className="glass-card p-6 bg-gradient-to-br from-white/60 to-indigo-50/30">
              <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                <History className="w-4 h-4" /> Parse History
              </div>
              <div className="space-y-3">
                {history.length === 0 && <p className="text-xs text-slate-400 italic">No recent extractions.</p>}
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/40 border border-white/60 rounded-xl hover:bg-white/60 transition-colors cursor-pointer" onClick={() => setParsedProfile(h)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-xs font-bold uppercase">
                        {h.firstName?.[0]}{h.lastName?.[0]}
                      </div>
                      <span className="text-sm font-semibold text-on-surface">{getTalentProfileFullName(h)}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 border-sky-100 bg-sky-50/20">
              <div className="flex items-center gap-2 mb-2 text-sky-600">
                <Zap className="w-4 h-4 fill-sky-600" />
                <span className="text-xs font-bold uppercase tracking-widest">Scanner Status</span>
              </div>
              <p className="text-sm text-slate-600 font-medium">{status}</p>
              {isParsing && (
                <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${parsingProgress}%` }} />
                </div>
              )}
            </div>
          </div>

          {/* Right: Parsed Resume Data (Column 6-12) */}
          <div className="lg:col-span-7">
            {parsedProfile ? (
              <div className="glass-card p-8 min-h-[700px] animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xl font-black">
                      {parsedProfile.firstName[0]}{parsedProfile.lastName[0]}
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-on-surface">{getTalentProfileFullName(parsedProfile)}</h2>
                      <p className="text-sm text-sky-600 font-semibold">{parsedProfile.headline}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parse Confidence</span>
                    <span className="text-2xl font-black text-indigo-600">98.4%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <SectionTitle icon={User} title="Contact Info" />
                    <div className="space-y-4">
                      <IdentityField icon={Mail} value={parsedProfile.email} />
                      <IdentityField icon={Phone} value={parsedProfile.phone || "No phone detected"} />
                      <IdentityField icon={Globe} value={parsedProfile.location} />
                    </div>

                    <SectionTitle icon={Zap} title="Skills" />
                    <div className="flex flex-wrap gap-2">
                      {parsedProfile.skills.map((s, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold shadow-sm hover:border-sky-400 transition-colors">
                          {s.name} • {s.level}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <SectionTitle icon={Database} title="Experience Layers" />
                    <div className="space-y-4">
                      {parsedProfile.experience.slice(0, 3).map((exp, i) => (
                        <div key={i} className="p-4 bg-white/40 border border-white/60 rounded-2xl relative overflow-hidden group">
                          <div className="dna-line opacity-5 left-0" />
                          <h4 className="text-sm font-bold text-on-surface">{exp.role}</h4>
                          <p className="text-xs text-indigo-600 font-semibold mb-2">{exp.company}</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/60 flex gap-4">
                  <button className="flex-1 py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-200 hover:scale-[1.02] transition-all">
                    Add to Talents
                  </button>
                  <button className="px-8 py-4 bg-white/60 border border-white text-slate-600 rounded-2xl font-bold hover:bg-white/80 transition-all">
                    Export Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center h-full flex flex-col justify-center items-center space-y-4 bg-white/20">
                <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center text-slate-300">
                  <FileText className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-400">Deep-Dive Mirror Ready</h3>
                <p className="text-slate-400 max-w-xs mx-auto text-sm leading-relaxed">
                  Upload a talent artifact on the left to launch the Split-Pane Mirror and see the AI-Extracted Truth.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {isCreatingChallenge ? (
            <div className="glass-card p-8 space-y-8">
              <div className="flex justify-between items-center border-b border-white/60 pb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-on-surface">Build New Assessment</h2>
                  <p className="text-slate-500 text-sm">Define the technical parameters for candidate verification.</p>
                </div>
                <button 
                  onClick={() => setIsCreatingChallenge(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1">Challenge Title</span>
                    <input 
                      value={editingChallenge.title}
                      onChange={e => setEditingChallenge({...editingChallenge, title: e.target.value})}
                      placeholder="e.g. Frontend Architecture Validation"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1">Challenge Type</span>
                      <select 
                        value={editingChallenge.type}
                        onChange={e => setEditingChallenge({...editingChallenge, type: e.target.value as ProofChallengeType})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                      >
                        <option value="coding">Coding</option>
                        <option value="sql">SQL Query</option>
                        <option value="document">Document Analysis</option>
                        <option value="debug">Debugging</option>
                        <option value="api">API Integration</option>
                        <option value="data">Data Transformation</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1">Min Passing Score</span>
                      <input 
                        type="number"
                        value={editingChallenge.rubric?.minimumPassingScore}
                        onChange={e => setEditingChallenge({...editingChallenge, rubric: {...editingChallenge.rubric!, minimumPassingScore: Number(e.target.value)}})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1">Recruiter Instructions</span>
                    <textarea 
                      rows={3}
                      value={editingChallenge.instructions}
                      onChange={e => setEditingChallenge({...editingChallenge, instructions: e.target.value})}
                      placeholder="Tell the candidate what you expect from them..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 ring-indigo-500/20 outline-none transition-all resize-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-600 block mb-1.5 ml-1">Challenge Prompt (The Task)</span>
                    <textarea 
                      rows={6}
                      value={editingChallenge.prompt}
                      onChange={e => setEditingChallenge({...editingChallenge, prompt: e.target.value})}
                      placeholder="Describe the actual technical task in detail..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all resize-none"
                    />
                  </label>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-600 ml-1">Test Cases (Auto-Scoring Signals)</span>
                    <button 
                      onClick={addTestCase}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                    >
                      <Plus className="w-3 h-3" /> Add Case
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {editingChallenge.testCases.map((tc, i) => (
                      <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 relative group">
                        <button 
                          onClick={() => removeTestCase(i)}
                          className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <input 
                          value={tc.title}
                          onChange={e => updateTestCase(i, "title", e.target.value)}
                          placeholder="Test Case Title"
                          className="w-full bg-transparent border-b border-slate-200 py-1 font-bold text-sm focus:border-indigo-500 outline-none transition-all"
                        />
                        <input 
                          value={tc.description}
                          onChange={e => updateTestCase(i, "description", e.target.value)}
                          placeholder="What does this verify?"
                          className="w-full bg-transparent text-xs text-slate-500 focus:text-slate-700 outline-none"
                        />
                        <div className="flex gap-3 items-center">
                           <div className="flex-1">
                             <input 
                               value={tc.expectedPatterns.join(", ")}
                               onChange={e => updateTestCase(i, "expectedPatterns", e.target.value.split(",").map(p => p.trim()).filter(Boolean))}
                               placeholder="Keywords/Patterns (comma separated)"
                               className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 ring-indigo-500/10 outline-none"
                             />
                           </div>
                           <div className="w-20">
                             <input 
                               type="number"
                               value={tc.weight}
                               onChange={e => updateTestCase(i, "weight", Number(e.target.value))}
                               placeholder="Weight"
                               className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-center focus:ring-2 ring-indigo-500/10 outline-none"
                             />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-white/60">
<button 
                      onClick={() => {
                        console.log("Create Assessment clicked");
                        handleCreateChallenge();
                      }}
                      disabled={
                        isSavingChallenge || 
                        !editingChallenge.title || 
                        !editingChallenge.prompt || 
                        !editingChallenge.instructions
                      }
                      className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" /> {isSavingChallenge ? "Creating..." : "Create Assessment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-display font-bold text-on-surface">Assessment Manager</h2>
                <button 
                  onClick={() => {
                    setEditingChallenge({
                      title: "",
                      type: "coding",
                      instructions: "",
                      prompt: "",
                      requiredSkills: [],
                      testCases: [
                        { title: "Correctness", description: "The solution should work as expected.", expectedPatterns: ["placeholder"], weight: 60 }
                      ],
                      rubric: {
                        correctnessWeight: 60,
                        qualityWeight: 20,
                        completenessWeight: 20,
                        minimumPassingScore: 60
                      }
                    });
                    setIsCreatingChallenge(true);
                  }}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> New Challenge
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Templates Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="glass-card p-6 bg-indigo-50/30 border-indigo-100">
                    <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Ready-to-Deploy Templates
                    </h3>
                    <div className="space-y-3">
                      {templates.map((template, i) => (
                        <div 
                          key={i} 
                          onClick={() => useTemplate(template)}
                          className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-on-surface group-hover:text-indigo-600 transition-colors">{template.title}</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{template.type}</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{template.prompt.slice(0, 100)}...</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Challenge List */}
                <div className="lg:col-span-2 space-y-4">
                  {challenges.length === 0 ? (
                    <div className="glass-card p-12 text-center bg-white/40 border-dashed border-2 flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                        <FileCode className="w-8 h-8" />
                      </div>
                      <p className="text-slate-400 font-medium">No custom missions deployed yet.</p>
                      <button 
                        onClick={() => setIsCreatingChallenge(true)}
                        className="text-indigo-600 font-bold text-sm hover:underline"
                      >
                        Launch the builder to get started.
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {challenges.map((challenge) => (
                        <div key={challenge.id} className="glass-card p-6 hover:shadow-lg transition-all border border-white/60 group">
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                              <FileCode className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{challenge.type}</span>
                          </div>
                          <h4 className="font-bold text-on-surface mb-1">{challenge.title}</h4>
                          <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{challenge.instructions}</p>
                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <CheckCircle2 className="w-3 h-3 text-green-500" /> {challenge.testCases.length} Signals
                            </div>
                            <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                              View Detailed Brief
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: any) {
  return (
    <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      <Icon className="w-3.5 h-3.5" /> {title}
    </div>
  );
}

function IdentityField({ icon: Icon, value }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/30 border border-white/60 rounded-xl">
      <Icon className="w-4 h-4 text-sky-500" />
      <span className="text-sm text-slate-700 font-medium truncate">{value}</span>
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
