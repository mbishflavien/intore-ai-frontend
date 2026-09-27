"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
}

const paddingClass = { sm: "p-4", md: "p-6", lg: "p-8", none: "" };

/**
 * Card — glass-card wrapper. Use CardHeader/CardTitle/CardContent for structure.
 */
export function Card({ children, className = "", hover = true, padding = "md" }: CardProps) {
  return (
    <div className={`glass-card ${hover ? "" : "hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"} ${paddingClass[padding]} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`.trim()}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`font-display text-lg font-bold text-on-surface tracking-tight ${className}`.trim()}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-4 ${className}`.trim()}>{children}</div>;
}
