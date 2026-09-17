"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface ChallengeData {
  id: string;
  title: string;
  type: string;
  instructions: string;
  prompt: string;
  starterCode?: string;
  starterQuery?: string;
  requiredSkills: string[];
  hints: Array<{ id: string; text: string; source: string }>;
  references: Array<{ id: string; title: string; url: string; type: string }>;
  documentConfig?: {
    requiredSections: string[];
    requiredKeywords: string[];
    minLength: number;
    maxLength: number;
  };
  sqlConfig?: {
    schema: { tables: string[]; columns: string[] };
    validPatterns: string[];
    blockedKeywords: string[];
  };
}

export default function ApplicantAssessmentPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { token } = useAuth();
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [mode, setMode] = useState<"required" | "optional">("optional");
  const [code, setCode] = useState("");
  const [evaluation, setEvaluation] = useState<{ score: number; summary: string; strengths: string[]; gaps: string[] } | null>(null);
  const [message, setMessage] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [showReferences, setShowReferences] = useState(false);

  useEffect(() => {
    api.proofhire.getChallengeForJob(jobId)
      .then(({ challenge: challengeData, mode: challengeMode }) => {
        setChallenge(challengeData);
        setMode(challengeMode);
        if (challengeData.type === "sql") {
          setCode(challengeData.starterQuery || "");
        } else {
          setCode(challengeData.starterCode || "");
        }
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Failed to load challenge");
      });

    if (token) {
      api.proofhire.getSubmission(jobId, token)
        .then(({ submission }) => {
          if (submission) {
            setCode(submission.code);
            if (submission.evaluation) {
              setEvaluation(submission.evaluation);
            }
          }
        })
        .catch(() => undefined);
    }
  }, [jobId, token]);

  const saveDraft = async () => {
    if (!token) {
      return;
    }

    try {
      await api.proofhire.saveSubmission(jobId, { code, language: "typescript" }, token);
      setMessage("Draft saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save draft.");
    }
  };

  const submitForEvaluation = async () => {
    if (!token) {
      return;
    }

    try {
      await api.proofhire.saveSubmission(jobId, { code, language: "typescript" }, token);
      const response = await api.proofhire.evaluateSubmission(jobId, token);
      if (response.evaluation) {
        setEvaluation(response.evaluation as { score: number; summary: string; strengths: string[]; gaps: string[] });
      }
      setMessage(`Submission evaluated. Current status: ${response.proofStatus}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to evaluate submission.");
    }
  };

  if (!challenge) {
    return <div style={{ padding: "40px", textAlign: "center" }}>{message || "Loading assessment..."}</div>;
  }

  const isDocument = challenge.type === "document";
  const isSQL = challenge.type === "sql";

  return (
    <div style={{ display: "grid", gridTemplateColumns: isDocument ? "1fr" : "1fr 320px", gap: "24px" }}>
      <section style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ marginBottom: "18px" }}>
          <Link href={`/applicant/jobs/${jobId}`} style={{ color: "#4f46e5", textDecoration: "none", fontWeight: "600" }}>
            Back to job
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a2e" }}>{challenge.title}</h1>
            <span style={{ padding: "4px 12px", background: "#e0e7ff", color: "#4338ca", borderRadius: "999px", fontSize: "13px", fontWeight: 600, textTransform: "capitalize" }}>
              {challenge.type}
            </span>
          </div>
          <p style={{ color: "#475569", marginTop: "6px" }}>{challenge.instructions}</p>
          <div style={{ marginTop: "12px", color: mode === "required" ? "#b45309" : "#0f766e", fontWeight: "600" }}>
            {mode === "required" ? "Required assessment" : "Optional assessment boost"}
          </div>
        </div>

        <div style={{ padding: "14px", borderRadius: "10px", background: "#f8fafc", color: "#334155", marginBottom: "16px" }}>
          {challenge.prompt}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {challenge.requiredSkills.map((skill) => (
            <span key={skill} style={{ padding: "6px 10px", borderRadius: "999px", background: "#e0e7ff", color: "#4338ca", fontSize: "13px", fontWeight: "600" }}>
              {skill}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          {challenge.hints?.length && (
            <button
              onClick={() => setShowHints(!showHints)}
              style={{
                padding: "8px 14px",
                background: showHints ? "#fef3c7" : "#f3f4f6",
                color: showHints ? "#92400e" : "#374151",
                border: "1px solid",
                borderColor: showHints ? "#fbbf24" : "#d1d5db",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {`Hints (${challenge.hints?.length || 0})`}
            </button>
          )}
          {challenge.references?.length && (
            <button
              onClick={() => setShowReferences(!showReferences)}
              style={{
                padding: "8px 14px",
                background: showReferences ? "#dbeafe" : "#f3f4f6",
                color: showReferences ? "#1e40af" : "#374151",
                border: "1px solid",
                borderColor: showReferences ? "#3b82f6" : "#d1d5db",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {`References (${challenge.references?.length || 0})`}
            </button>
          )}
        </div>

        {showHints && challenge.hints?.length && (
          <div style={{ padding: "14px", borderRadius: "10px", background: "#fefce8", border: "1px solid #fde047", marginBottom: "16px" }}>
            <div style={{ fontWeight: 600, color: "#854d0e", marginBottom: "8px" }}>Available Hints</div>
            <ul style={{ paddingLeft: "18px", color: "#713f12" }}>
              {challenge.hints?.map((hint) => (
                <li key={hint.id} style={{ marginBottom: "6px" }}>
                  {hint.text}
                  {hint.source === "system" && (
                    <span style={{ marginLeft: "6px", fontSize: "11px", color: "#a16207" }}>(system hint)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showReferences && challenge.references?.length && (
          <div style={{ padding: "14px", borderRadius: "10px", background: "#eff6ff", border: "1px solid #93c5fd", marginBottom: "16px" }}>
            <div style={{ fontWeight: 600, color: "#1e40af", marginBottom: "8px" }}>Helpful References</div>
            <ul style={{ paddingLeft: "18px", color: "#1e3a8a" }}>
              {challenge.references?.map((ref) => (
                <li key={ref.id} style={{ marginBottom: "6px" }}>
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>
                    {ref.title}
                  </a>
                  <span style={{ marginLeft: "6px", fontSize: "11px", color: "#64748b" }}>({ref.type})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isSQL && (
          <div style={{ padding: "12px", borderRadius: "8px", background: "#f1f5f9", marginBottom: "16px", fontSize: "13px", color: "#475569" }}>
            <strong>SQL Tips:</strong> Use SELECT, FROM, WHERE, ORDER BY, LIMIT. Avoid blocked keywords: {challenge.sqlConfig?.blockedKeywords?.join(", ")}.
          </div>
        )}

        {isDocument && challenge.documentConfig && (
          <div style={{ padding: "12px", borderRadius: "8px", background: "#f1f5f9", marginBottom: "16px", fontSize: "13px", color: "#475569" }}>
            <strong>Requirements:</strong> {challenge.documentConfig.minLength}-{challenge.documentConfig.maxLength} words.
            Include: {challenge.documentConfig.requiredKeywords?.join(", ")}.
          </div>
        )}

        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
            {isSQL ? "Your SQL Query" : isDocument ? "Your Document" : "Your Solution"}
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={isDocument ? 12 : 22}
            placeholder={
              isSQL
                ? "SELECT name, score FROM candidates ORDER BY score DESC LIMIT 10"
                : isDocument
                ? "Write your cover letter here..."
                : "// Write your code here"
            }
            style={{
              width: "100%",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              padding: "16px",
              fontFamily: isSQL || !isDocument ? "monospace" : "inherit",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <button onClick={saveDraft} style={secondaryButtonStyle}>Save Draft</button>
          <button onClick={submitForEvaluation} style={primaryButtonStyle}>Submit for Evaluation</button>
        </div>
        {message && <div style={{ marginTop: "12px", color: "#4338ca" }}>{message}</div>}
      </section>

      {!isDocument && (
        <aside style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", alignSelf: "start" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#1a1a2e", marginBottom: "12px" }}>Evaluation</h2>
          {evaluation ? (
            <div>
              <div style={{ fontSize: "36px", fontWeight: "bold", color: "#0f766e", marginBottom: "10px" }}>{evaluation.score}%</div>
              <p style={{ color: "#475569", marginBottom: "14px" }}>{evaluation.summary}</p>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontWeight: "600", color: "#0f766e", marginBottom: "6px" }}>Strengths</div>
                <ul style={{ paddingLeft: "18px", color: "#475569" }}>
                  {evaluation.strengths.map((strength) => <li key={strength}>{strength}</li>)}
                </ul>
              </div>
              <div>
                <div style={{ fontWeight: "600", color: "#b45309", marginBottom: "6px" }}>Gaps</div>
                <ul style={{ paddingLeft: "18px", color: "#475569" }}>
                  {evaluation.gaps.map((gap) => <li key={gap}>{gap}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <p style={{ color: "#64748b" }}>No evaluation yet. Submit your solution to get verified feedback.</p>
          )}
        </aside>
      )}
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  background: "#4f46e5",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
};