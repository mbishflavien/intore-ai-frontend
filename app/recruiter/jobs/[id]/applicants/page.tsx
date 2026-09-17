"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Target, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  User, 
  CheckCircle2, 
  XCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Activity,
  Award,
  X,
  Video,
  Phone,
  MapPin
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type ApplicationStatus = "submitted" | "under_review" | "shortlisted" | "rejected" | "accepted";

interface Application {
  id: string;
  jobId: string;
  applicantId: string;
  status: ApplicationStatus;
  appliedAt: string;
  profile: {
    firstName: string;
    lastName: string;
    headline: string;
    email: string;
    location: string;
    skills: { name: string; level: string; yearsOfExperience: number }[];
    experience: { company: string; role: string; description: string }[];
    education: { institution: string; degree: string; fieldOfStudy: string }[];
  };
  screeningResult?: {
    jobTitle: string;
    totalApplicants: number;
    shortlisted: RankedCandidate[];
    generatedAt: string;
  };
  proofHireStatus?: string;
  proofScore?: number;
}

interface RankedCandidate {
  applicantId: string;
  rank: number;
  fullName: string;
  score: { skills: number; experience: number; education: number; relevance: number; total: number };
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

export default function ValidationEnginePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { token } = useAuth();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScreening, setIsScreening] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    duration: 60,
    type: 'video' as 'video' | 'phone' | 'onsite',
    meetingLink: '',
    notes: ''
  });

  useEffect(() => {
    const fetchApplications = async () => {
      if (!token) return;
      try {
        const { applications: apps } = await api.jobs.getApplications(jobId, token);
        setApplications(apps);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [jobId, token]);

  const handleScreen = async () => {
    if (!token) return;
    setIsScreening(true);
    try {
      await api.jobs.screen(jobId, token);
      const { applications: apps } = await api.jobs.getApplications(jobId, token);
      setApplications(apps);
    } catch (err) {
      console.error("Screening failed:", err);
    } finally {
      setIsScreening(false);
    }
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    if (!token) {
      console.error("No token");
      return;
    }
    if (!applicationId) {
      console.error("No applicationId found. Applications:", applications);
      console.error("Selected candidate:", selectedCandidate);
      alert("Error: Application not found. Try clicking a candidate first.");
      return;
    }
    console.log("Updating application:", applicationId, "to status:", newStatus);
    try {
      await api.applications.updateStatus(applicationId, newStatus as ApplicationStatus, token);
      console.log("Status updated successfully");
      // Refetch applications from API to get fresh data
      const { applications: freshApps } = await api.jobs.getApplications(jobId, token);
      setApplications(freshApps);
      console.log("Refetched applications, new status should be:", newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleScheduleInterview = async () => {
    if (!token || !selectedCandidate) return;
    
    const application = applications.find(a => a.applicantId === selectedCandidate.applicantId);
    if (!application) {
      alert("Please select a candidate first");
      return;
    }

    if (!scheduleForm.date || !scheduleForm.time) {
      alert("Please select date and time");
      return;
    }

    setIsScheduling(true);
    try {
      const scheduledAt = `${scheduleForm.date}T${scheduleForm.time}:00`;
      await api.interviews.create({
        applicationId: application.id,
        jobId: jobId,
        candidateId: application.applicantId,
        scheduledAt,
        duration: scheduleForm.duration,
        type: scheduleForm.type,
        meetingLink: scheduleForm.meetingLink || undefined,
        notes: scheduleForm.notes || undefined,
      }, token);
      
      alert("Interview scheduled successfully! The candidate has been notified.");
      setShowScheduleModal(false);
      setScheduleForm({
        date: '',
        time: '',
        duration: 60,
        type: 'video',
        meetingLink: '',
        notes: ''
      });
    } catch (err) {
      console.error("Failed to schedule interview:", err);
      alert("Failed to schedule interview");
    } finally {
      setIsScheduling(false);
    }
  };

  const shortlist = applications[0]?.screeningResult?.shortlisted || [];
  const selectedCandidate = shortlist.find(c => c.applicantId === selectedCandidateId) || shortlist[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/40 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Applicants</h1>
            <p className="text-slate-500">Review candidates for {applications[0]?.screeningResult?.jobTitle || "your job"}</p>
          </div>
        </div>

        <button
          onClick={handleScreen}
          disabled={isScreening || applications.length === 0}
          className="px-8 py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-[24px] font-bold shadow-lg shadow-sky-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isScreening ? <Activity className="w-5 h-5 animate-pulse" /> : <Zap className="w-5 h-5" />}
          {isScreening ? "Running AI..." : "Run AI Screening"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Candidate Stream (Column 1-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-display text-xl font-bold text-slate-700">Applicants</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{applications.length} Candidates</span>
          </div>

          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-hide">
            {applications.map((app) => {
              const result = shortlist.find(s => s.applicantId === app.applicantId);
              const isSelected = selectedCandidateId === app.applicantId || (!selectedCandidateId && shortlist[0]?.applicantId === app.applicantId);
              const statusColor = app.status === 'rejected' ? 'ring-2 ring-red-400' : app.status === 'accepted' ? 'ring-2 ring-green-400' : 'ring-2 ring-sky-400';

              return (
                <div 
                  key={app.id}
                  onClick={() => setSelectedCandidateId(app.applicantId)}
                  className={`glass-card p-5 cursor-pointer transition-all relative overflow-hidden group ${
                    isSelected ? `${statusColor} ${app.status === 'rejected' ? 'bg-red-50/30' : app.status === 'accepted' ? 'bg-green-50/30' : 'bg-white/60'}` : "hover:bg-white/50"
                  }`}
                >
                  {result && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-sky-500 text-white text-[10px] font-bold rounded-bl-xl shadow-sm">
                      #{result.rank} RANK
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold shrink-0 border border-white/60 group-hover:border-sky-200 transition-colors">
                      {app.profile.firstName[0]}{app.profile.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-on-surface truncate pr-8">{app.profile.firstName} {app.profile.lastName}</h3>
                        {result && <span className="text-sky-600 font-display font-black">{result.score.total}%</span>}
                      </div>
                      <p className="text-xs text-slate-500 truncate mb-3">{app.profile.headline}</p>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          <Award className="w-3 h-3" /> Proof {app.proofScore ?? 0}%
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          <Activity className="w-3 shadow-sm" /> 
                          <span className={`capitalize ${
                            app.status === 'accepted' ? 'text-green-500' : 
                            app.status === 'rejected' ? 'text-red-500' : 
                            app.status === 'shortlisted' ? 'text-green-500' : 'text-slate-500'
                          }`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Validation Engine Detail (Column 6-12) */}
        <div className="lg:col-span-7">
          {selectedCandidate ? (
            <div className="glass-card p-8 min-h-[800px] flex flex-col sticky top-32">
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-6 items-center">
                  <div className="w-20 h-20 rounded-[24px] bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-sky-100">
                    {selectedCandidate.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-black text-on-surface">{selectedCandidate.fullName}</h2>
                    <div className="flex gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-2 py-1 rounded-full">
                        AI Certified Match
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-full">
                        Rank #{selectedCandidate.rank}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const appId = applications.find(a => a.applicantId === selectedCandidate?.applicantId)?.id;
                      console.log("Accept clicked - appId:", appId, "selectedCandidate:", selectedCandidate);
                      handleUpdateStatus(appId!, 'accepted');
                    }}
                    className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => {
                      const appId = applications.find(a => a.applicantId === selectedCandidate?.applicantId)?.id;
                      console.log("Reject clicked - appId:", appId, "selectedCandidate:", selectedCandidate);
                      handleUpdateStatus(appId!, 'rejected');
                    }}
                    className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Match Nebula (Radar Visualization) */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="bg-white/30 border border-white/60 rounded-[24px] p-6 space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Score Breakdown</h4>
                  <div className="space-y-4">
                    <ScoreBar label="Skills" value={selectedCandidate.score.skills} color="sky" />
                    <ScoreBar label="Experience" value={selectedCandidate.score.experience} color="indigo" />
                    <ScoreBar label="Education" value={selectedCandidate.score.education} color="cyan" />
                    <ScoreBar label="Relevance" value={selectedCandidate.score.relevance} color="violet" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-[24px] p-6 text-white flex flex-col justify-center items-center shadow-lg shadow-sky-200">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Total Fit Score</span>
                  <span className="text-6xl font-black font-display">{selectedCandidate.score.total}%</span>
                  <span className="mt-4 text-xs font-medium bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-md">
                    Top 5% of Applicant Pool
                  </span>
                </div>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto pr-4 scrollbar-hide">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Key Strengths
                    </h4>
                    <ul className="space-y-2">
                      {selectedCandidate.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-slate-700 bg-green-50/50 border border-green-100/50 p-3 rounded-xl flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Potential Gaps
                    </h4>
                    <ul className="space-y-2">
                      {selectedCandidate.gaps.map((g, i) => (
                        <li key={i} className="text-sm text-slate-700 bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                    <Target className="w-3 h-3" /> AI Recommendation
                  </h4>
                  <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-2xl p-6 text-slate-700 leading-relaxed italic font-medium">
                    "{selectedCandidate.recommendation}"
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skill Inventory</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.matchedSkills.map(s => (
                      <span key={s} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold shadow-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-auto flex gap-4">
                <button 
                  onClick={() => selectedCandidate && setShowScheduleModal(true)}
                  disabled={!selectedCandidate}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  Schedule Interview
                </button>
                <button className="px-8 py-4 bg-white/60 border border-white text-slate-600 rounded-2xl font-bold hover:bg-white/80 transition-all">
                  Export PDF Report
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center h-full flex flex-col justify-center items-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <Zap className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-400">No Candidate Selected</h3>
              <p className="text-slate-400 max-w-xs mx-auto">Select a candidate from the pool to launch the Validation Engine and review AI insights.</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-on-surface">Schedule Interview</h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">with {selectedCandidate.fullName}</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Date</label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Time</label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Duration</label>
                <select
                  value={scheduleForm.duration}
                  onChange={(e) => setScheduleForm({...scheduleForm, duration: parseInt(e.target.value)})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Interview Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleForm({...scheduleForm, type: 'video'})}
                    className={`flex-1 p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${scheduleForm.type === 'video' ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-slate-200 text-slate-600'}`}
                  >
                    <Video className="w-4 h-4" /> Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleForm({...scheduleForm, type: 'phone'})}
                    className={`flex-1 p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${scheduleForm.type === 'phone' ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-slate-200 text-slate-600'}`}
                  >
                    <Phone className="w-4 h-4" /> Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleForm({...scheduleForm, type: 'onsite'})}
                    className={`flex-1 p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${scheduleForm.type === 'onsite' ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-slate-200 text-slate-600'}`}
                  >
                    <MapPin className="w-4 h-4" /> Onsite
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Meeting Link (optional)</label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm({...scheduleForm, meetingLink: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Notes (optional)</label>
                <textarea
                  placeholder="Interview agenda, topics to cover..."
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm h-24 resize-none"
                />
              </div>
            </div>
            
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleInterview}
                disabled={isScheduling}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isScheduling ? "Scheduling..." : "Schedule Interview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color }: any) {
  const colors: any = {
    sky: "bg-sky-400",
    indigo: "bg-indigo-400",
    cyan: "bg-cyan-400",
    violet: "bg-violet-400",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} rounded-full`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}
