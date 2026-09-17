"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push(user.role === "recruiter" ? "/recruiter" : "/applicant");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div style={{ color: "white", fontSize: "18px" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "48px",
        width: "100%",
        maxWidth: "500px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        textAlign: "center"
      }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "bold",
          marginBottom: "16px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          IntoreAI
        </h1>
        <p style={{ color: "#666", marginBottom: "32px", fontSize: "16px" }}>
          AI-powered talent screening platform for recruiters and job seekers
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Link
            href="/login"
            style={{
              display: "block",
              padding: "16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            style={{
              display: "block",
              padding: "16px",
              background: "white",
              border: "2px solid #667eea",
              color: "#667eea",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            Create Account
          </Link>
        </div>

        <p style={{ marginTop: "32px", color: "#999", fontSize: "14px" }}>
          Select "Job Seeker" or "Recruiter" when registering
        </p>
      </div>
    </div>
  );
}

