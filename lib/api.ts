import type {
  ActivityLog,
  Application,
  ApplicationStatus,
  CreateJobInput,
  CreateProofChallengeInput,
  Job,
  MentorChatResponse,
  Notification,
  PracticeChallengeLite,
  ProofChallenge,
  ProofEvaluation,
  ProofHireConfig,
  ProofSubmission,
  PublicUser,
  ScreeningRunRecord,
  SystemHealth,
  TalentProfile,
  TrainingModule,
  TrainingProgress,
  TrainingRecommendation,
} from "@/lib/types";

/**
 * The API is reached same-origin: middleware.ts proxies /api/* to the backend. That keeps
 * the HttpOnly session cookie first-party (SameSite=Strict works) and out of JavaScript —
 * there is no token in this file or in storage; the browser attaches the cookie itself.
 */
export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  // Proxies (e.g. a waking Render instance) can answer with HTML instead of JSON.
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `Request failed with status ${response.status}`) as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/** Error thrown by request(); `data` carries server fields like captchaRequired or passwordErrors. */
export type ApiError = Error & {
  status?: number;
  data?: {
    error?: string;
    captchaRequired?: boolean;
    retryAfterSeconds?: number;
    passwordErrors?: string[];
    attemptsRemaining?: number;
    restart?: boolean;
  };
};

export type LoginResult = { user: PublicUser; mfaRequired?: undefined } | { mfaRequired: true; user?: undefined };

export const api = {
  auth: {
    register: (data: { username: string; firstName: string; lastName: string; email: string; password: string; role: "applicant" | "recruiter"; captchaToken?: string }) =>
      request<{ user: PublicUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (data: { emailOrUsername: string; password: string; captchaToken?: string }) =>
      request<LoginResult>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    verifyOtp: (code: string) =>
      request<{ user: PublicUser }>("/api/auth/verify-otp", { method: "POST", body: JSON.stringify({ code }) }),
    logout: () => request<{ success: boolean }>("/api/auth/logout", { method: "POST" }),
    logoutAll: () => request<{ success: boolean }>("/api/auth/logout-all", { method: "POST" }),
    me: () => request<{ user: PublicUser }>("/api/auth/me"),
    deleteMyAccount: (password: string) =>
      request<{ message: string }>("/api/auth/delete", { method: "DELETE", body: JSON.stringify({ password }) }),
    mfa: {
      status: () => request<{ enabled: boolean; backupCodesRemaining: number }>("/api/auth/mfa"),
      setup: () => request<{ qrDataUrl: string; otpauthUrl: string; secret: string }>("/api/auth/mfa/setup", { method: "POST" }),
      enable: (code: string) =>
        request<{ enabled: true; backupCodes: string[] }>("/api/auth/mfa/enable", { method: "POST", body: JSON.stringify({ code }) }),
      regenerateBackupCodes: (code: string) =>
        request<{ backupCodes: string[] }>("/api/auth/mfa/backup-codes", { method: "POST", body: JSON.stringify({ code }) }),
      disable: (password: string, code: string) =>
        request<{ enabled: false }>("/api/auth/mfa/disable", { method: "POST", body: JSON.stringify({ password, code }) }),
    },
    deleteUser: (username: string) =>
      request<{ message: string }>(`/api/users/delete/${encodeURIComponent(username)}`, { method: "DELETE" }),
  },
  jobs: {
    list: () => request<{ jobs: Job[] }>("/api/jobs"),
    get: (id: string) => request<{ job: Job }>(`/api/jobs/${id}`),
    create: (data: CreateJobInput) =>
      request<{ job: Job }>("/api/jobs", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Job>) =>
      request<{ job: Job }>(`/api/jobs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/api/jobs/${id}`, { method: "DELETE" }),
    publish: (id: string) =>
      request<{ job: Job }>(`/api/jobs/${id}/publish`, { method: "POST" }),
    close: (id: string) =>
      request<{ job: Job }>(`/api/jobs/${id}/close`, { method: "POST" }),
    listByRecruiter: () => request<{ jobs: Job[] }>("/api/recruiter/jobs"),
    getApplications: (id: string) =>
      request<{ applications: Application[] }>(`/api/jobs/${id}/applications`),
    screen: (id: string) =>
      request<{ run: ScreeningRunRecord }>(`/api/jobs/${id}/screen`, { method: "POST" }),
    listActivity: () => request<{ activities: Array<{ type: string; timestamp: string; candidateName: string; jobTitle: string; newStatus: string; previousStatus: string | null }> }>("/api/recruiter/activity"),
  },
  applications: {
    list: () => request<{ applications: Application[] }>("/api/applications"),
    create: (data: { jobId: string; profile: TalentProfile }) =>
      request<{ application: Application }>("/api/applications", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: ApplicationStatus) =>
      request<{ application: Application }>(`/api/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
  },
  profiles: {
    parse: (data: { mimeType: string; base64: string }) =>
      request<{ profile: TalentProfile }>("/api/profiles/parse", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: () => request<{ profile: TalentProfile }>("/api/profiles"),
    save: (profile: TalentProfile) =>
      request<{ message: string; profile: TalentProfile }>("/api/profiles", {
        method: "POST",
        body: JSON.stringify({ profile }),
      }),
    update: (profile: TalentProfile) =>
      request<{ message: string; profile: TalentProfile }>("/api/profiles", {
        method: "PUT",
        body: JSON.stringify({ profile }),
      }),
  },
  proofhire: {
    templates: () => request<{ templates: unknown[] }>("/api/proofhire/templates"),
    listChallenges: () => request<{ challenges: ProofChallenge[] }>("/api/proofhire/challenges"),
    createChallenge: (data: CreateProofChallengeInput) =>
      request<{ challenge: ProofChallenge }>("/api/proofhire/challenges", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateChallenge: (id: string, data: Partial<ProofChallenge>) =>
      request<{ challenge: ProofChallenge }>(`/api/proofhire/challenges/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    getChallengeForJob: (jobId: string) =>
      request<{ challenge: ProofChallenge; mode: ProofHireConfig["mode"] }>(`/api/proofhire/jobs/${jobId}/challenge`),
    getPreviousQuestions: (jobId: string) =>
      request<{ questions: Array<{ challengeId: string; title: string; type: string; hintCount: number; referenceCount: number; submissionCount: number }> }>(`/api/proofhire/jobs/${jobId}/questions`),
    updateJobConfig: (jobId: string, proofHire: ProofHireConfig) =>
      request<{ job: Job }>(`/api/proofhire/jobs/${jobId}/config`, {
        method: "PUT",
        body: JSON.stringify({ proofHire }),
      }),
    getSubmission: (jobId: string) =>
      request<{ submission: ProofSubmission | null }>(`/api/proofhire/jobs/${jobId}/submission`),
    saveSubmission: (jobId: string, data: { code: string; language?: string }) =>
      request<{ submission: ProofSubmission }>(`/api/proofhire/jobs/${jobId}/submission`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    evaluateSubmission: (jobId: string) =>
      request<{ submission: ProofSubmission; evaluation: ProofSubmission["evaluation"]; proofStatus: string }>(
        `/api/proofhire/jobs/${jobId}/submission/evaluate`,
        { method: "POST" },
      ),
    getResults: (jobId: string) =>
      request<{ submissions: ProofSubmission[]; proofHire: ProofHireConfig }>(`/api/proofhire/jobs/${jobId}/results`),
    listMySubmissions: () =>
      request<{ submissions: any[] }>("/api/proofhire/my-submissions"),
  },
  notifications: {
    list: () => request<{ notifications: Notification[] }>("/api/notifications"),
    readAll: () => request<{ success: boolean }>("/api/notifications/read-all", { method: "POST" }),
    markOne: (id: string) =>
      request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: "POST" }),
    markRecruiterFeedRead: () =>
      request<{ success: boolean }>("/api/recruiter/notifications/read-all", { method: "POST" }),
    listUnread: () => request<{ notifications: Array<{ id: string; jobTitle: string; candidateName: string; createdAt: string }>; unreadCount: number }>("/api/recruiter/notifications"),
  },
  interviews: {
    create: (data: {
      applicationId: string;
      jobId: string;
      candidateId: string;
      scheduledAt: string;
      duration: number;
      type: 'video' | 'phone' | 'onsite';
      meetingLink?: string;
      notes?: string;
    }) =>
      request<{ interview: any; notification: any }>("/api/interviews", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    list: () =>
      request<{ interviews: any[] }>("/api/interviews"),
  },
  training: {
    listModules: () => request<{ modules: TrainingModule[] }>("/api/training"),
    getModule: (id: string) => request<{ module: TrainingModule }>(`/api/training/${id}`),
    getProgress: () =>
      request<{ progress: TrainingProgress[] }>("/api/training/progress"),
    markUnitComplete: (moduleId: string, unitId: string) =>
      request<{ progress: TrainingProgress[] }>(`/api/training/progress/${moduleId}`, {
        method: "POST",
        body: JSON.stringify({ unitId }),
      }),
    getRecommendations: () =>
      request<{ recommendations: TrainingRecommendation[] }>("/api/training/recommendations"),
    listPracticeChallenges: () =>
      request<{ challenges: PracticeChallengeLite[] }>("/api/training/practice"),
    getPracticeChallenge: (challengeId: string) =>
      request<{ challenge: ProofChallenge }>(`/api/training/practice/${challengeId}`),
    practiceEvaluate: (challengeId: string, code: string) =>
      request<{ evaluation: ProofEvaluation; practice: boolean }>("/api/training/practice/evaluate", {
        method: "POST",
        body: JSON.stringify({ challengeId, code }),
      }),
  },
  mentor: {
    chat: (data: { skill?: string; message: string; sessionId?: string }) =>
      request<MentorChatResponse>("/api/mentor/chat", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  admin: {
    getStats: () => request<{
      totalApplicants: number;
      acceptedApplicants: number;
      totalJobs: number;
      publishedJobs: number;
      closedJobs: number;
      systemUptime: number;
      avgMatch: number;
      screenedCount: number;
      timeSavedHours: number;
    }>("/api/stats"),
    getSystemHealth: () => request<SystemHealth>("/api/system/health"),
    getActivityLogs: () => request<{ activities: ActivityLog[] }>("/api/activity"),
  },
};
