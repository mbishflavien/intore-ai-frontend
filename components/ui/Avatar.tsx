"use client";

interface AvatarProps {
  name?: string;
  email?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" };

/**
 * Avatar — initial-based glass avatar with accessible label.
 */
export function Avatar({ name, email, size = "md", className = "" }: AvatarProps) {
  const initial = (name?.[0] || email?.[0] || "U").toUpperCase();
  return (
    <span
      role="img"
      aria-label={name ? `Avatar for ${name}` : "User avatar"}
      className={`flex items-center justify-center overflow-hidden rounded-full border-2 border-white/60 bg-indigo-50 font-bold text-indigo-600 shadow-sm ${sizeClass[size]} ${className}`.trim()}
    >
      {initial}
    </span>
  );
}
