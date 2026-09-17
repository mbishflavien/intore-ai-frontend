import type {
  ActivityLog,
  Application,
  ApplicationStatus,
  CreateJobInput,
  CreateProofChallengeInput,
  Job,
  Notification,
  ProofChallenge,
  ProofHireConfig,
  ProofSubmission,
  PublicUser,
  ScreeningRunRecord,
  SystemHealth,
  TalentProfile,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  auth: {
    register: (data: { username: string; firstName: string; lastName: string; email: string; password: string; role: "applicant" | "recruiter" }) =>
      request<{ user: PublicUser; token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (data: { emailOrUsername: string; password: string }) =>
      request<{ user: PublicUser; token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    me: (token: string) => request<{ user: PublicUser }>("/api/auth/me", { token }),
    deleteMyAccount: (token: string) => request<{ message: string }>("/api/auth/delete", { method: "DELETE", token }),
    deleteUser: (username: string, token: string) =>
      request<{ message: string }>(`/api/users/delete/${encodeURIComponent(username)}`, { method: "DELETE", token }),
  },
  jobs: {
    list: () => request<{ jobs: Job[] }>("/api/jobs"),
    get: (id: string) => request<{ job: Job }>(`/api/jobs/${id}`),
    create: (data: CreateJobInput, token: string) =>
      request<{ job: Job }>("/api/jobs", { method: "POST", body: JSON.stringify(data), token }),
    update: (id: string, data: Partial<Job>, token: string) =>
      request<{ job: Job }>(`/api/jobs/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
    delete: (id: string, token: string) => request<void>(`/api/jobs/${id}`, { method: "DELETE", token }),
    publish: (id: string, token: string) =>
      request<{ job: Job }>(`/api/jobs/${id}/publish`, { method: "POST", token }),
    close: (id: string, token: string) =>
      request<{ job: Job }>(`/api/jobs/${id}/close`, { method: "POST", token }),
    listByRecruiter: (token: string) => request<{ jobs: Job[] }>("/api/recruiter/jobs", { token }),
    getApplications: (id: string, token: string) =>
      request<{ applications: Application[] }>(`/api/jobs/${id}/applications`, { token }),
    screen: (id: string, token: string) =>
      request<{ run: ScreeningRunRecord }>(`/api/jobs/${id}/screen`, { method: "POST", token }),
    listActivity: (token: string) => request<{ activities: Array<{ type: string; timestamp: string; candidateName: string; jobTitle: string; newStatus: string; previousStatus: string | null }> }>("/api/recruiter/activity", { token }),
  },
  applications: {
    list: (token: string) => request<{ applications: Application[] }>("/api/applications", { token }),
    create: (data: { jobId: string; profile: TalentProfile }, token: string) =>
      request<{ application: Application }>("/api/applications", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),
    updateStatus: (id: string, status: ApplicationStatus, token: string) =>
      request<{ application: Application }>(`/api/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
        token,
      }),
  },
  profiles: {
    parse: (data: { mimeType: string; base64: string }) =>
      request<{ profile: TalentProfile }>("/api/profiles/parse", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (token: string) => request<{ profile: TalentProfile }>("/api/profiles", { token }),
    save: (profile: TalentProfile, token: string) =>
      request<{ message: string; profile: TalentProfile }>("/api/profiles", {
        method: "POST",
        body: JSON.stringify({ profile }),
        token,
      }),
    update: (profile: TalentProfile, token: string) =>
      request<{ message: string; profile: TalentProfile }>("/api/profiles", {
        method: "PUT",
        body: JSON.stringify({ profile }),
        token,
      }),
  },
  proofhire: {
    templates: () => request<{ templates: unknown[] }>("/api/proofhire/templates"),
    listChallenges: (token: string) => request<{ challenges: ProofChallenge[] }>("/api/proofhire/challenges", { token }),
    createChallenge: (data: CreateProofChallengeInput, token: string) =>
      request<{ challenge: ProofChallenge }>("/api/proofhire/challenges", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),
    updateChallenge: (id: string, data: Partial<ProofChallenge>, token: string) =>
      request<{ challenge: ProofChallenge }>(`/api/proofhire/challenges/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        token,
      }),
    getChallengeForJob: (jobId: string) =>
      request<{ challenge: ProofChallenge; mode: ProofHireConfig["mode"] }>(`/api/proofhire/jobs/${jobId}/challenge`),
    getPreviousQuestions: (jobId: string) =>
      request<{ questions: Array<{ challengeId: string; title: string; type: string; hintCount: number; referenceCount: number; submissionCount: number }> }>(`/api/proofhire/jobs/${jobId}/questions`),
    updateJobConfig: (jobId: string, proofHire: ProofHireConfig, token: string) =>
      request<{ job: Job }>(`/api/proofhire/jobs/${jobId}/config`, {
        method: "PUT",
        body: JSON.stringify({ proofHire }),
        token,
      }),
    getSubmission: (jobId: string, token: string) =>
      request<{ submission: ProofSubmission | null }>(`/api/proofhire/jobs/${jobId}/submission`, { token }),
    saveSubmission: (jobId: string, data: { code: string; language?: string }, token: string) =>
      request<{ submission: ProofSubmission }>(`/api/proofhire/jobs/${jobId}/submission`, {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),
    evaluateSubmission: (jobId: string, token: string) =>
      request<{ submission: ProofSubmission; evaluation: ProofSubmission["evaluation"]; proofStatus: string }>(
        `/api/proofhire/jobs/${jobId}/submission/evaluate`,
        { method: "POST", token },
      ),
    getResults: (jobId: string, token: string) =>
      request<{ submissions: ProofSubmission[]; proofHire: ProofHireConfig }>(`/api/proofhire/jobs/${jobId}/results`, { token }),
    listMySubmissions: (token: string) =>
      request<{ submissions: any[] }>("/api/proofhire/my-submissions", { token }),
  },
  notifications: {
    list: (token: string) => request<{ notifications: Notification[] }>("/api/notifications", { token }),
    readAll: (token: string) => request<{ success: boolean }>("/api/notifications/read-all", { method: "POST", token }),
    listUnread: (token: string) => request<{ notifications: Array<{ id: string; jobTitle: string; candidateName: string; createdAt: string }>; unreadCount: number }>("/api/recruiter/notifications", { token }),
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
    }, token: string) =>
      request<{ interview: any; notification: any }>("/api/interviews", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),
    list: (token: string) =>
      request<{ interviews: any[] }>("/api/interviews", { token }),
  },
  admin: {
    getStats: (token: string) => request<{
      totalApplicants: number;
      acceptedApplicants: number;
      totalJobs: number;
      publishedJobs: number;
      closedJobs: number;
      systemUptime: number;
      avgMatch: number;
      screenedCount: number;
      timeSavedHours: number;
    }>("/api/stats", { token }),
    getSystemHealth: () => request<SystemHealth>("/api/system/health"),
    getActivityLogs: (token: string) => request<{ activities: ActivityLog[] }>("/api/activity", { token }),
  },
};
