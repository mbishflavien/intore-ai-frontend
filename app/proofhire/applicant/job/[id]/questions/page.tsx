"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

interface Question {
  challengeId: string;
  title: string;
  type: string;
  hintCount: number;
  referenceCount: number;
  submissionCount: number;
  applicantPosition?: string;
}

export default function PreviousQuestionsPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.proofhire.getPreviousQuestions(jobId)
      .then(({ questions: q }) => {
        setQuestions(q);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load questions");
        setLoading(false);
      });
  }, [jobId]);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading questions...</div>;
  }

  if (error) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#dc2626" }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link href={`/applicant/jobs/${jobId}`} style={{ color: "#4f46e5", textDecoration: "none", fontWeight: "600" }}>
          Back to job
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a2e", marginTop: "12px" }}>
          Technical Questions for This Role
        </h1>
        <p style={{ color: "#64748b", marginTop: "8px" }}>
          See what kinds of technical questions others faced when applying for this position.
          This helps you prepare and apply with confidence.
        </p>
      </div>

      {questions.length === 0 ? (
        <div style={{ background: "white", borderRadius: "12px", padding: "32px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
          <p style={{ color: "#64748b" }}>No previous questions recorded yet for this position.</p>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "8px" }}>
            Be the first to complete a technical challenge and help others prepare!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {questions.map((q, index) => (
            <div
              key={q.challengeId}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ padding: "4px 10px", background: "#e0e7ff", color: "#4338ca", borderRadius: "999px", fontSize: "13px", fontWeight: 600, textTransform: "capitalize" }}>
                    {q.type || "coding"}
                  </span>
                  <span style={{ padding: "4px 10px", background: "#f3f4f6", color: "#64748b", borderRadius: "999px", fontSize: "12px" }}>
                    #{index + 1}
                  </span>
                </div>
                {q.applicantPosition && (
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    Applied for: <strong style={{ color: "#374151" }}>{q.applicantPosition}</strong>
                  </span>
                )}
              </div>

              <div style={{ color: "#374151", fontWeight: 500, marginBottom: "12px" }}>
                {q.title || "Technical Challenge"}
              </div>

              <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#64748b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>💡</span>
                  <span>{q.hintCount} hints available</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>📎</span>
                  <span>{q.referenceCount} references</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>👥</span>
                  <span>{q.submissionCount} submissions</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "32px", padding: "20px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
        <h3 style={{ color: "#166534", fontWeight: 600, marginBottom: "8px" }}>Why see previous questions?</h3>
        <p style={{ color: "#15803d", fontSize: "14px" }}>
          By understanding the types of challenges for this role, you can prepare better and know what to expect.
          All questions shown are anonymized - you see the category but not the exact problem.
        </p>
      </div>
    </div>
  );
}