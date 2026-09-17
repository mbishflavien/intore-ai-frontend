"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface Skill {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsOfExperience: number;
}

interface WorkExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string[];
  isCurrent: boolean;
}

interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  startDate: string;
  endDate: string;
}

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio: string;
  location: string;
  phone: string;
  skills: Skill[];
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  availability: { status: string; type: string };
  linkedin: string;
  github: string;
  portfolio: string;
}

export default function ViewProfilePage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setIsLoading(false);
        setError("Please log in to view your profile");
        return;
      }

      try {
        const { profile: savedProfile } = await api.profiles.get(token);
        setProfile({
          firstName: savedProfile.firstName,
          lastName: savedProfile.lastName,
          headline: savedProfile.headline,
          bio: savedProfile.bio,
          location: savedProfile.location,
          phone: savedProfile.phone,
          skills: savedProfile.skills || [],
          experience: savedProfile.experience || [],
          education: savedProfile.education || [],
          projects: savedProfile.projects || [],
          availability: savedProfile.availability || { status: "Available", type: "Full-time" },
          linkedin: savedProfile.socialLinks?.linkedin || "",
          github: savedProfile.socialLinks?.github || "",
          portfolio: savedProfile.socialLinks?.portfolio || "",
        } as Profile);
      } catch {
        setError("Profile not found. Please complete your profile first.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "You haven't created your profile yet."}</p>
          <Link
            href="/applicant/profile"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  const hasProfile = profile.firstName || profile.lastName || profile.headline || profile.skills.length > 0;

  if (!hasProfile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600 mb-6">Add your information to make your profile visible to recruiters.</p>
          <Link
            href="/applicant/profile"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Expert": return "bg-purple-100 text-purple-700";
      case "Advanced": return "bg-blue-100 text-blue-700";
      case "Intermediate": return "bg-green-100 text-green-700";
      case "Beginner": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-green-100 text-green-700";
      case "Open to Opportunities": return "bg-blue-100 text-blue-700";
      case "Not Available": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <Link
          href="/applicant/profile"
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
        >
          Edit Profile
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl text-white font-bold">
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">
                {profile.firstName} {profile.lastName}
              </h2>
              {profile.headline && (
                <p className="text-purple-100 mt-1">{profile.headline}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-purple-100">
                {profile.location && (
                  <span className="flex items-center gap-1">📍 {profile.location}</span>
                )}
                {profile.email && <span>✉️ {profile.email}</span>}
                {profile.phone && <span>📞 {profile.phone}</span>}
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getAvailabilityColor(profile.availability.status)}`}>
                {profile.availability.status}
              </span>
              <p className="text-purple-100 text-sm mt-1">{profile.availability.type}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {profile.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">About</h3>
              <p className="text-gray-600">{profile.bio}</p>
            </div>
          )}

          {profile.skills.length > 0 && profile.skills.some(s => s.name) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.filter(s => s.name).map((skill, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${getLevelColor(skill.level)}`}
                  >
                    {skill.name}
                    {skill.yearsOfExperience > 0 && (
                      <span className="ml-1 text-xs opacity-75">({skill.yearsOfExperience}y)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.experience.length > 0 && profile.experience.some(e => e.company || e.role) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Experience</h3>
              <div className="space-y-4">
                {profile.experience.filter(e => e.company || e.role).map((exp, i) => (
                  <div key={i} className="border-l-2 border-purple-200 pl-4">
                    <h4 className="font-medium text-gray-800">{exp.role || "Role not specified"}</h4>
                    <p className="text-purple-600">{exp.company || "Company not specified"}</p>
                    <p className="text-sm text-gray-500">
                      {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="text-gray-600 mt-1 text-sm">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.education.length > 0 && profile.education.some(e => e.institution) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Education</h3>
              <div className="space-y-3">
                {profile.education.filter(e => e.institution).map((edu, i) => (
                  <div key={i} className="border-l-2 border-purple-200 pl-4">
                    <h4 className="font-medium text-gray-800">{edu.institution}</h4>
                    <p className="text-purple-600">
                      {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                    </p>
                    {(edu.startYear || edu.endYear) && (
                      <p className="text-sm text-gray-500">
                        {edu.startYear || "N/A"} - {edu.endYear || "Present"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(profile.linkedin || profile.github || profile.portfolio) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Links</h3>
              <div className="flex flex-wrap gap-3">
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    LinkedIn
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
                  >
                    GitHub
                  </a>
                )}
                {profile.portfolio && (
                  <a
                    href={profile.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                  >
                    Portfolio
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
