import type { TalentProfile } from "@/lib/types";

export interface ProfileCompleteness {
  complete: boolean;
  missing: string[];
}

/**
 * Client mirror of backend checkProfileCompleteness
 * (intore-ai-backend/packages/shared/src/index.ts).
 * Keep the missing labels in sync across both repos.
 */
export function checkProfileCompleteness(
  profile: Partial<TalentProfile> | null | undefined,
): ProfileCompleteness {
  const missing: string[] = [];
  if (!profile) return { complete: false, missing: ["Profile not found"] };
  if (!profile.firstName?.trim()) missing.push("First name");
  if (!profile.lastName?.trim()) missing.push("Last name");
  if (!profile.headline?.trim()) missing.push("Professional headline");
  if (!profile.location?.trim()) missing.push("Location");
  if (!Array.isArray(profile.skills) || profile.skills.length < 3)
    missing.push("At least 3 skills");
  if (!Array.isArray(profile.experience) || profile.experience.length < 1)
    missing.push("At least 1 work experience entry");
  if (!Array.isArray(profile.education) || profile.education.length < 1)
    missing.push("At least 1 education entry");
  return { complete: missing.length === 0, missing };
}
