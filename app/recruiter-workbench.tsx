"use client";

import { startTransition, useEffect, useState } from "react";

import type {
  ApplicantData,
  JobRequirementInput,
  RankedCandidate,
  SocialLinks,
  TalentProfile,
} from "@/lib/types";
import {
  getTalentProfileFullName,
  isTalentProfile,
  mapApplicantToTalentProfile,
} from "@/lib/types";

type ScreeningRun = {
  id: string;
  result: {
    jobTitle: string;
    totalApplicants: number;
    reasoningMode: string;
    shortlisted: RankedCandidate[];
  };
  createdAt: string;
};

type ReviewRecord = {
  id: string;
  screeningRunId: string;
  applicantId: string;
  decision: "advance" | "hold" | "reject";
  note?: string;
  createdAt: string;
};

type JobFormState = {
  title: string;
  summary: string;
  requiredSkills: string;
  preferredSkills: string;
  dealbreakers: string;
  minimumYearsExperience: number;
  educationLevel: string;
  location: string;
  anonymizeCandidates: boolean;
  weights: {
    skills: number;
    experience: number;
    education: number;
    relevance: number;
  };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const defaultJob: JobFormState = {
  title: "AI HR Product Engineer",
  summary: "Build recruiter-facing workflows for screening and shortlisting job applicants.",
  requiredSkills: "TypeScript, Next.js, Node.js, MongoDB",
  preferredSkills: "Redux, Prompt Engineering, Gemini",
  dealbreakers: "no mongodb, visa sponsorship required",
  minimumYearsExperience: 3,
  educationLevel: "Bachelor",
  location: "Kigali",
  anonymizeCandidates: false,
  weights: {
    skills: 50,
    experience: 20,
    education: 10,
    relevance: 20,
  },
};

export function RecruiterWorkbench() {
  const [runs, setRuns] = useState<ScreeningRun[]>([]);
  const [activeRun, setActiveRun] = useState<ScreeningRun | null>(null);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [csvText, setCsvText] = useState("");
  const [lastResumeImport, setLastResumeImport] = useState<TalentProfile | null>(null);
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [profileDraft, setProfileDraft] = useState<TalentProfile>(createEmptyProfile());
  const [job, setJob] = useState(defaultJob);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("Loading screening history...");
  const [isRunning, setIsRunning] = useState(false);
  const [isDraggingResumes, setIsDraggingResumes] = useState(false);

  useEffect(() => {
    void refreshRuns();
  }, []);

  async function refreshRuns() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/screenings`, { cache: "no-store" });
      const data = (await response.json()) as ScreeningRun[];
      setRuns(data);
      if (data[0]) {
        await selectRun(data[0].id);
      } else {
        setStatus("No screening runs yet. Upload applicants or create a structured profile.");
      }
    } catch {
      setStatus("API unavailable. Start the local API on port 4000.");
    }
  }

  async function selectRun(runId: string) {
    const response = await fetch(`${apiBaseUrl}/api/screenings/${runId}`, { cache: "no-store" });
    const data = (await response.json()) as { run: ScreeningRun; reviews: ReviewRecord[] };
    setActiveRun(data.run);
    setReviews(data.reviews);
    setStatus(`Loaded run ${data.run.id}`);
  }

  async function ingestCsv() {
    const response = await fetch(`${apiBaseUrl}/api/ingest/csv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvText }),
    });
    const data = (await response.json()) as { applicants?: ApplicantData[]; error?: string };
    if (!response.ok || !data.applicants) {
      setStatus(data.error ?? "CSV ingestion failed.");
      return;
    }
    const importedApplicants = data.applicants ?? [];
    setApplicants((current) => dedupeApplicants([...current, ...importedApplicants]));
    setStatus(`Imported ${importedApplicants.length} applicants from CSV.`);
  }

  async function importResumeFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const importedApplicants: TalentProfile[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(bytes);
      const response = await fetch(`${apiBaseUrl}/api/ingest/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: file.type || "application/pdf", base64 }),
      });
      const data = (await response.json()) as { applicant?: TalentProfile; error?: string };
      if (!response.ok || !data.applicant) {
        setStatus(data.error ?? `Resume parsing failed for ${file.name}.`);
        continue;
      }

      importedApplicants.push({
        ...data.applicant,
        firstName:
          getTalentProfileFullName(data.applicant) === "Unknown Candidate"
            ? file.name.replace(/\.[^.]+$/, "")
            : data.applicant.firstName,
      });
    }

    if (importedApplicants.length === 0) {
      return;
    }

    setApplicants((current) => dedupeApplicants([...current, ...importedApplicants]));
    setLastResumeImport(importedApplicants[importedApplicants.length - 1] ?? null);
    setStatus(`Imported ${importedApplicants.length} applicants from resume upload.`);
  }

  async function handleResumeUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    await importResumeFiles(files);
    event.target.value = "";
  }

  async function handleResumeDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingResumes(false);
    const files = Array.from(event.dataTransfer.files).filter((file) =>
      isSupportedResumeType(file),
    );
    await importResumeFiles(files);
  }

  function addStructuredProfile() {
    const profile = sanitizeProfileDraft(profileDraft);
    setApplicants((current) => dedupeApplicants([...current, profile]));
    setProfileDraft(createEmptyProfile());
    setStatus(`Added structured profile for ${getTalentProfileFullName(profile)}.`);
  }

  async function runScreening() {
    setIsRunning(true);
    setStatus("Running shortlist generation...");

    const payload = {
      job: buildJobPayload(job),
      applicants,
      shortlistSize: 10,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/screen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const run = (await response.json()) as ScreeningRun;
      if (!response.ok) {
        setStatus("Screening run failed.");
        setIsRunning(false);
        return;
      }

      startTransition(() => {
        setActiveRun(run);
        setRuns((current) => [run, ...current.filter((entry) => entry.id !== run.id)]);
        setReviews([]);
        setStatus(`Generated shortlist for ${run.result.totalApplicants} applicants.`);
      });
    } catch {
      setStatus("Could not reach the screening API.");
    } finally {
      setIsRunning(false);
    }
  }

  async function submitReview(applicantId: string, decision: "advance" | "hold" | "reject") {
    if (!activeRun) {
      return;
    }

    const response = await fetch(`${apiBaseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        screeningRunId: activeRun.id,
        applicantId,
        decision,
        note: reviewNotes[applicantId] ?? "",
      }),
    });
    const review = (await response.json()) as ReviewRecord;
    if (!response.ok) {
      setStatus("Failed to save recruiter review.");
      return;
    }
    setReviews((current) => [review, ...current]);
    setStatus(`Saved ${decision} review for ${applicantId}.`);
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">IntoreAI AI Recruiter Workbench</p>
          <h1>Screen, explain, and review candidates with a human-in-control pipeline.</h1>
          <p className="lede">
            The workflow below supports legacy imports and the structured Talent Profile Schema.
          </p>
        </div>
        <div className="callout">
          <p>Status</p>
          <strong>{status}</strong>
          <code>API: {apiBaseUrl}</code>
          <code>Applicants loaded: {applicants.length}</code>
        </div>
      </section>

      <section className="workspace-grid">
        <article className="panel">
          <h2>1. Job setup</h2>
          <label className="field">
            <span>Role title</span>
            <input value={job.title} onChange={(event) => setJob({ ...job, title: event.target.value })} />
          </label>
          <label className="field">
            <span>Summary</span>
            <textarea value={job.summary} onChange={(event) => setJob({ ...job, summary: event.target.value })} rows={4} />
          </label>
          <label className="field">
            <span>Required skills</span>
            <input value={job.requiredSkills} onChange={(event) => setJob({ ...job, requiredSkills: event.target.value })} />
          </label>
          <label className="field">
            <span>Preferred skills</span>
            <input value={job.preferredSkills} onChange={(event) => setJob({ ...job, preferredSkills: event.target.value })} />
          </label>
          <label className="field">
            <span>Dealbreakers</span>
            <input value={job.dealbreakers} onChange={(event) => setJob({ ...job, dealbreakers: event.target.value })} />
          </label>
          <div className="split-fields">
            <label className="field">
              <span>Min experience</span>
              <input
                type="number"
                value={job.minimumYearsExperience}
                onChange={(event) => setJob({ ...job, minimumYearsExperience: Number(event.target.value) })}
              />
            </label>
            <label className="field">
              <span>Education</span>
              <input value={job.educationLevel} onChange={(event) => setJob({ ...job, educationLevel: event.target.value })} />
            </label>
            <label className="field">
              <span>Location</span>
              <input value={job.location} onChange={(event) => setJob({ ...job, location: event.target.value })} />
            </label>
          </div>
          <div className="split-fields">
            <label className="field">
              <span>Skills weight</span>
              <input type="number" value={job.weights.skills} onChange={(event) => setJob({ ...job, weights: { ...job.weights, skills: Number(event.target.value) } })} />
            </label>
            <label className="field">
              <span>Experience weight</span>
              <input type="number" value={job.weights.experience} onChange={(event) => setJob({ ...job, weights: { ...job.weights, experience: Number(event.target.value) } })} />
            </label>
            <label className="field">
              <span>Education weight</span>
              <input type="number" value={job.weights.education} onChange={(event) => setJob({ ...job, weights: { ...job.weights, education: Number(event.target.value) } })} />
            </label>
            <label className="field">
              <span>Relevance weight</span>
              <input type="number" value={job.weights.relevance} onChange={(event) => setJob({ ...job, weights: { ...job.weights, relevance: Number(event.target.value) } })} />
            </label>
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={job.anonymizeCandidates}
              onChange={(event) => setJob({ ...job, anonymizeCandidates: event.target.checked })}
            />
            <span>Anonymize candidate names during screening</span>
          </label>
        </article>

        <article className="panel">
          <h2>2. Import applicants</h2>
          <label className="field">
            <span>Paste CSV rows</span>
            <textarea
              rows={8}
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              placeholder={'id,fullName,skills,yearsExperience,educationLevel,location,email,phone,profileSummary\nor use structured columns like skills="[{"name":"Node.js","level":"Expert","yearsOfExperience":4}]"'}
            />
          </label>
          <button className="button" onClick={ingestCsv}>Import CSV applicants</button>

          <div className="resume-box">
            <p className="section-kicker">Resume upload</p>
            <div
              className="dropzone"
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingResumes(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingResumes(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                const nextTarget = event.relatedTarget;
                if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                  setIsDraggingResumes(false);
                }
              }}
              onDrop={(event) => void handleResumeDrop(event)}
              style={{
                border: isDraggingResumes ? "2px solid #0f766e" : "2px dashed rgba(15, 118, 110, 0.35)",
                borderRadius: "16px",
                padding: "20px",
                background: isDraggingResumes ? "rgba(15, 118, 110, 0.08)" : "rgba(255, 255, 255, 0.03)",
                marginBottom: "12px",
              }}
            >
              <input type="file" multiple accept=".pdf,.txt,application/pdf,text/plain" onChange={handleResumeUpload} />
              <p className="subtle">
                Drag and drop multiple resumes here, or use the file picker to select several at once.
              </p>
            </div>
            <p className="subtle">
              {lastResumeImport
                ? `Last parsed: ${getTalentProfileFullName(lastResumeImport)} • ${lastResumeImport.headline}`
                : "Upload one or many PDF or text resumes. Applicants are added automatically."}
            </p>
          </div>

          <div className="list compact">
            {applicants.map((applicant) => (
              <div className="candidate" key={getApplicantId(applicant)}>
                <div className="candidate-header">
                  <strong>{getApplicantName(applicant)}</strong>
                  <span>{applicant.source}</span>
                </div>
                {renderApplicantSummary(applicant)}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="workspace-grid">
        <article className="panel">
          <h2>3. Create profile</h2>
          <div className="split-fields">
            <label className="field">
              <span>First name</span>
              <input value={profileDraft.firstName} onChange={(event) => setProfileDraft({ ...profileDraft, firstName: event.target.value })} />
            </label>
            <label className="field">
              <span>Last name</span>
              <input value={profileDraft.lastName} onChange={(event) => setProfileDraft({ ...profileDraft, lastName: event.target.value })} />
            </label>
            <label className="field">
              <span>Email</span>
              <input value={profileDraft.email} onChange={(event) => setProfileDraft({ ...profileDraft, email: event.target.value })} />
            </label>
          </div>
          <div className="split-fields">
            <label className="field">
              <span>Headline</span>
              <input value={profileDraft.headline} onChange={(event) => setProfileDraft({ ...profileDraft, headline: event.target.value })} />
            </label>
            <label className="field">
              <span>Location</span>
              <input value={profileDraft.location} onChange={(event) => setProfileDraft({ ...profileDraft, location: event.target.value })} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input value={profileDraft.phone ?? ""} onChange={(event) => setProfileDraft({ ...profileDraft, phone: event.target.value })} />
            </label>
          </div>
          <label className="field">
            <span>Bio</span>
            <textarea rows={4} value={profileDraft.bio ?? ""} onChange={(event) => setProfileDraft({ ...profileDraft, bio: event.target.value })} />
          </label>

          <StructuredArrayEditor
            title="Skills"
            items={profileDraft.skills}
            addLabel="Add skill"
            onAdd={() =>
              setProfileDraft((current) => ({
                ...current,
                skills: [...current.skills, { name: "", level: "Intermediate", yearsOfExperience: 0 }],
              }))
            }
            onRemove={(index) =>
              setProfileDraft((current) => ({
                ...current,
                skills: current.skills.filter((_, itemIndex) => itemIndex !== index),
              }))
            }
            renderItem={(skill, index) => (
              <div className="split-fields">
                <input value={skill.name} placeholder="Skill" onChange={(event) => updateSkill(index, "name", event.target.value, setProfileDraft)} />
                <select value={skill.level} onChange={(event) => updateSkill(index, "level", event.target.value, setProfileDraft)}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
                <input
                  type="number"
                  value={skill.yearsOfExperience}
                  placeholder="Years"
                  onChange={(event) => updateSkill(index, "yearsOfExperience", Number(event.target.value), setProfileDraft)}
                />
              </div>
            )}
          />

          <StructuredArrayEditor
            title="Experience"
            items={profileDraft.experience}
            addLabel="Add experience"
            onAdd={() =>
              setProfileDraft((current) => ({
                ...current,
                experience: [...current.experience, createEmptyExperience()],
              }))
            }
            onRemove={(index) =>
              setProfileDraft((current) => ({
                ...current,
                experience: current.experience.filter((_, itemIndex) => itemIndex !== index),
              }))
            }
            renderItem={(experience, index) => (
              <>
                <div className="split-fields">
                  <input value={experience.company} placeholder="Company" onChange={(event) => updateExperience(index, "company", event.target.value, setProfileDraft)} />
                  <input value={experience.role} placeholder="Role" onChange={(event) => updateExperience(index, "role", event.target.value, setProfileDraft)} />
                </div>
                <div className="split-fields">
                  <input value={experience.startDate} placeholder="YYYY-MM" onChange={(event) => updateExperience(index, "startDate", event.target.value, setProfileDraft)} />
                  <input value={experience.endDate} placeholder="YYYY-MM or Present" onChange={(event) => updateExperience(index, "endDate", event.target.value, setProfileDraft)} />
                </div>
                <label className="field">
                  <span>Description</span>
                  <textarea rows={3} value={experience.description} onChange={(event) => updateExperience(index, "description", event.target.value, setProfileDraft)} />
                </label>
              </>
            )}
          />

          <StructuredArrayEditor
            title="Education"
            items={profileDraft.education}
            addLabel="Add education"
            onAdd={() =>
              setProfileDraft((current) => ({
                ...current,
                education: [...current.education, createEmptyEducation()],
              }))
            }
            onRemove={(index) =>
              setProfileDraft((current) => ({
                ...current,
                education: current.education.filter((_, itemIndex) => itemIndex !== index),
              }))
            }
            renderItem={(education, index) => (
              <>
                <div className="split-fields">
                  <input value={education.institution} placeholder="Institution" onChange={(event) => updateEducation(index, "institution", event.target.value, setProfileDraft)} />
                  <input value={education.degree} placeholder="Degree" onChange={(event) => updateEducation(index, "degree", event.target.value, setProfileDraft)} />
                  <input value={education.fieldOfStudy} placeholder="Field of study" onChange={(event) => updateEducation(index, "fieldOfStudy", event.target.value, setProfileDraft)} />
                </div>
                <div className="split-fields">
                  <input type="number" value={education.startYear} placeholder="Start year" onChange={(event) => updateEducation(index, "startYear", Number(event.target.value), setProfileDraft)} />
                  <input type="number" value={education.endYear} placeholder="End year" onChange={(event) => updateEducation(index, "endYear", Number(event.target.value), setProfileDraft)} />
                </div>
              </>
            )}
          />

          <StructuredArrayEditor
            title="Projects"
            items={profileDraft.projects}
            addLabel="Add project"
            onAdd={() =>
              setProfileDraft((current) => ({
                ...current,
                projects: [...current.projects, createEmptyProject()],
              }))
            }
            onRemove={(index) =>
              setProfileDraft((current) => ({
                ...current,
                projects: current.projects.filter((_, itemIndex) => itemIndex !== index),
              }))
            }
            renderItem={(project, index) => (
              <>
                <div className="split-fields">
                  <input value={project.name} placeholder="Project name" onChange={(event) => updateProject(index, "name", event.target.value, setProfileDraft)} />
                  <input value={project.role} placeholder="Role" onChange={(event) => updateProject(index, "role", event.target.value, setProfileDraft)} />
                  <input value={project.link ?? ""} placeholder="Link" onChange={(event) => updateProject(index, "link", event.target.value, setProfileDraft)} />
                </div>
                <label className="field">
                  <span>Description</span>
                  <textarea rows={3} value={project.description} onChange={(event) => updateProject(index, "description", event.target.value, setProfileDraft)} />
                </label>
              </>
            )}
          />

          <div className="split-fields">
            <label className="field">
              <span>Availability status</span>
              <select value={profileDraft.availability.status} onChange={(event) => setProfileDraft({ ...profileDraft, availability: { ...profileDraft.availability, status: event.target.value as TalentProfile["availability"]["status"] } })}>
                <option>Available</option>
                <option>Open to Opportunities</option>
                <option>Not Available</option>
              </select>
            </label>
            <label className="field">
              <span>Availability type</span>
              <select value={profileDraft.availability.type} onChange={(event) => setProfileDraft({ ...profileDraft, availability: { ...profileDraft.availability, type: event.target.value as TalentProfile["availability"]["type"] } })}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
              </select>
            </label>
            <label className="field">
              <span>Start date</span>
              <input value={profileDraft.availability.startDate ?? ""} placeholder="YYYY-MM-DD" onChange={(event) => setProfileDraft({ ...profileDraft, availability: { ...profileDraft.availability, startDate: event.target.value } })} />
            </label>
          </div>
          <div className="split-fields">
            <label className="field">
              <span>LinkedIn</span>
              <input value={profileDraft.socialLinks?.linkedin ?? ""} onChange={(event) => setProfileDraft({ ...profileDraft, socialLinks: { ...profileDraft.socialLinks, linkedin: event.target.value } })} />
            </label>
            <label className="field">
              <span>GitHub</span>
              <input value={profileDraft.socialLinks?.github ?? ""} onChange={(event) => setProfileDraft({ ...profileDraft, socialLinks: { ...profileDraft.socialLinks, github: event.target.value } })} />
            </label>
            <label className="field">
              <span>Portfolio</span>
              <input value={profileDraft.socialLinks?.portfolio ?? ""} onChange={(event) => setProfileDraft({ ...profileDraft, socialLinks: { ...profileDraft.socialLinks, portfolio: event.target.value } })} />
            </label>
          </div>
          <button className="button" onClick={addStructuredProfile}>Add structured profile</button>
        </article>

        <article className="panel">
          <div className="row">
            <h2>4. Screening output</h2>
            <button className="button" onClick={runScreening} disabled={isRunning || applicants.length === 0}>
              {isRunning ? "Running..." : "Run screening"}
            </button>
          </div>
          {activeRun ? (
            <>
              <p className="subtle">
                {activeRun.result.jobTitle} • {activeRun.result.totalApplicants} applicants • reasoning mode {activeRun.result.reasoningMode}
              </p>
              <div className="list">
                {activeRun.result.shortlisted.map((candidate) => (
                  <div className="candidate" key={candidate.applicantId}>
                    <div className="candidate-header">
                      <span>#{candidate.rank}</span>
                      <strong>{candidate.fullName}</strong>
                      <span>{candidate.score.total}/100</span>
                    </div>
                    {candidate.profile ? (
                      <>
                        <p><strong>Headline:</strong> {candidate.profile.headline}</p>
                        <p><strong>Location:</strong> {candidate.profile.location}</p>
                        <p><strong>Availability:</strong> {candidate.profile.availability.status} • {candidate.profile.availability.type}</p>
                        <p>
                          <strong>Skills:</strong>{" "}
                          {candidate.profile.skills.map((skill) => `${skill.name} (${skill.level}, ${skill.yearsOfExperience}y)`).join(", ") || "None"}
                        </p>
                        <p>
                          <strong>Projects:</strong>{" "}
                          {candidate.profile.projects.map((project) => project.name).join(", ") || "None"}
                        </p>
                      </>
                    ) : null}
                    <p>
                      <strong>Strengths:</strong> {candidate.strengths.join("; ") || "None provided"}
                    </p>
                    <p>
                      <strong>Gaps:</strong> {candidate.gaps.join("; ") || "No major gaps"}
                    </p>
                    <p>
                      <strong>Risk:</strong> {candidate.fraudRisk.level}
                      {candidate.fraudRisk.signals.length ? ` • ${candidate.fraudRisk.signals.join("; ")}` : ""}
                    </p>
                    <p>
                      <strong>Recommendation:</strong> {candidate.recommendation}
                    </p>
                    {candidate.dealbreakerHits.length > 0 ? (
                      <p>
                        <strong>Dealbreakers:</strong> {candidate.dealbreakerHits.join(", ")}
                      </p>
                    ) : null}
                    <div className="score-grid">
                      <span>Skills {candidate.score.skills}</span>
                      <span>Experience {candidate.score.experience}</span>
                      <span>Education {candidate.score.education}</span>
                      <span>Relevance {candidate.score.relevance}</span>
                    </div>
                    <textarea
                      className="review-note"
                      rows={3}
                      placeholder="Recruiter note"
                      value={reviewNotes[candidate.applicantId] ?? ""}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [candidate.applicantId]: event.target.value,
                        }))
                      }
                    />
                    <div className="actions">
                      <button className="button approve" onClick={() => submitReview(candidate.applicantId, "advance")}>Advance</button>
                      <button className="button secondary" onClick={() => submitReview(candidate.applicantId, "hold")}>Hold</button>
                      <button className="button danger" onClick={() => submitReview(candidate.applicantId, "reject")}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="subtle">No active screening run yet.</p>
          )}
        </article>
      </section>

      <section className="workspace-grid">
        <article className="panel">
          <h2>5. Review history</h2>
          <div className="history">
            <div>
              <p className="section-kicker">Runs</p>
              <div className="list compact">
                {runs.map((run) => (
                  <button className="history-item" key={run.id} onClick={() => void selectRun(run.id)}>
                    <strong>{run.result.jobTitle}</strong>
                    <span>{new Date(run.createdAt).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="section-kicker">Recruiter decisions</p>
              <div className="list compact">
                {reviews.map((review) => (
                  <div className="candidate" key={review.id}>
                    <div className="candidate-header">
                      <strong>{review.applicantId}</strong>
                      <span>{review.decision}</span>
                    </div>
                    <p>{review.note || "No recruiter note provided."}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

function StructuredArrayEditor<T>({
  title,
  items,
  addLabel,
  onAdd,
  onRemove,
  renderItem,
}: {
  title: string;
  items: T[];
  addLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="field">
      <div className="row">
        <span>{title}</span>
        <button className="button secondary" type="button" onClick={onAdd}>{addLabel}</button>
      </div>
      <div className="list compact">
        {items.length === 0 ? <p className="subtle">No {title.toLowerCase()} added yet.</p> : null}
        {items.map((item, index) => (
          <div className="candidate" key={`${title}-${index}`}>
            {renderItem(item, index)}
            <button className="button danger" type="button" onClick={() => onRemove(index)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderApplicantSummary(applicant: ApplicantData) {
  const profile = isTalentProfile(applicant) ? applicant : mapApplicantToTalentProfile(applicant);

  return (
    <>
      <p>
        <strong>Headline:</strong> {profile.headline}
      </p>
      <p>
        <strong>Skills:</strong>{" "}
        {profile.skills.map((skill) => `${skill.name} (${skill.level})`).join(", ") || "None"}
      </p>
      <p>
        <strong>Experience:</strong> {profile.experience.length || 0} entries
      </p>
      <p>
        <strong>Availability:</strong> {profile.availability.status}
      </p>
    </>
  );
}

function buildJobPayload(job: JobFormState): JobRequirementInput {
  return {
    title: job.title,
    summary: job.summary,
    requiredSkills: splitValues(job.requiredSkills),
    preferredSkills: splitValues(job.preferredSkills),
    dealbreakers: splitValues(job.dealbreakers),
    minimumYearsExperience: Number(job.minimumYearsExperience),
    educationLevel: job.educationLevel || undefined,
    location: job.location || undefined,
    anonymizeCandidates: job.anonymizeCandidates,
    screeningWeights: {
      skills: Number(job.weights.skills),
      experience: Number(job.weights.experience),
      education: Number(job.weights.education),
      relevance: Number(job.weights.relevance),
    },
  };
}

function createEmptyProfile(): TalentProfile {
  return {
    id: `manual-${crypto.randomUUID()}`,
    source: "umurava_profile",
    firstName: "",
    lastName: "",
    email: "",
    headline: "",
    bio: "",
    location: "Kigali, Rwanda",
    skills: [],
    languages: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    availability: {
      status: "Available",
      type: "Full-time",
    },
    socialLinks: {},
    phone: "",
  };
}

function createEmptyExperience(): TalentProfile["experience"][number] {
  return {
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    description: "",
    technologies: [],
    isCurrent: false,
  };
}

function createEmptyEducation(): TalentProfile["education"][number] {
  return {
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startYear: 0,
    endYear: 0,
  };
}

function createEmptyProject(): TalentProfile["projects"][number] {
  return {
    name: "",
    description: "",
    technologies: [],
    role: "",
    startDate: "",
    endDate: "",
    link: "",
  };
}

function sanitizeProfileDraft(profile: TalentProfile): TalentProfile {
  return {
    ...profile,
    firstName: profile.firstName.trim() || "Unknown",
    lastName: profile.lastName.trim(),
    headline: profile.headline.trim() || "No headline provided",
    location: profile.location.trim() || "Unknown",
    bio: profile.bio?.trim() || undefined,
    phone: profile.phone?.trim() || undefined,
    socialLinks: cleanupSocialLinks(profile.socialLinks),
    skills: profile.skills.filter((skill) => skill.name.trim()),
    languages: profile.languages?.filter((language) => language.name.trim()),
    experience: profile.experience.filter((entry) => entry.company.trim() || entry.role.trim() || entry.description.trim()),
    education: profile.education.filter((entry) => entry.institution.trim() || entry.degree.trim()),
    certifications: profile.certifications?.filter((entry) => entry.name.trim()),
    projects: profile.projects.filter((project) => project.name.trim() || project.description.trim()),
  };
}

function cleanupSocialLinks(value: SocialLinks | undefined): SocialLinks | undefined {
  if (!value) {
    return undefined;
  }

  const entries = Object.entries(value).filter(([, item]) => item?.trim());
  return entries.length > 0 ? Object.fromEntries(entries) as SocialLinks : undefined;
}

function updateSkill(
  index: number,
  key: keyof TalentProfile["skills"][number],
  value: string | number,
  setProfileDraft: React.Dispatch<React.SetStateAction<TalentProfile>>,
) {
  setProfileDraft((current) => ({
    ...current,
    skills: current.skills.map((skill, itemIndex) =>
      itemIndex === index ? { ...skill, [key]: value } : skill),
  }));
}

function updateExperience(
  index: number,
  key: keyof TalentProfile["experience"][number],
  value: string | boolean,
  setProfileDraft: React.Dispatch<React.SetStateAction<TalentProfile>>,
) {
  setProfileDraft((current) => ({
    ...current,
    experience: current.experience.map((entry, itemIndex) =>
      itemIndex === index ? { ...entry, [key]: value } : entry),
  }));
}

function updateEducation(
  index: number,
  key: keyof TalentProfile["education"][number],
  value: string | number,
  setProfileDraft: React.Dispatch<React.SetStateAction<TalentProfile>>,
) {
  setProfileDraft((current) => ({
    ...current,
    education: current.education.map((entry, itemIndex) =>
      itemIndex === index ? { ...entry, [key]: value } : entry),
  }));
}

function updateProject(
  index: number,
  key: keyof TalentProfile["projects"][number],
  value: string,
  setProfileDraft: React.Dispatch<React.SetStateAction<TalentProfile>>,
) {
  setProfileDraft((current) => ({
    ...current,
    projects: current.projects.map((project, itemIndex) =>
      itemIndex === index ? { ...project, [key]: value } : project),
  }));
}

function splitValues(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isSupportedResumeType(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.type === "text/plain" ||
    file.name.toLowerCase().endsWith(".pdf") ||
    file.name.toLowerCase().endsWith(".txt")
  );
}

function dedupeApplicants(applicants: ApplicantData[]): ApplicantData[] {
  const seen = new Set<string>();
  return applicants.filter((applicant) => {
    const id = getApplicantId(applicant);
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
}

function getApplicantId(applicant: ApplicantData): string {
  if (isTalentProfile(applicant)) {
    return applicant.id ?? `${applicant.email}-${applicant.firstName}-${applicant.lastName}`;
  }
  return applicant.id;
}

function getApplicantName(applicant: ApplicantData): string {
  if (isTalentProfile(applicant)) {
    return getTalentProfileFullName(applicant);
  }
  return applicant.fullName;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
