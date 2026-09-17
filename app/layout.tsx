import "./globals.css";
import type { ReactNode } from "react";
import { AuthProvider } from "../lib/auth-context";

export const metadata = {
  title: "IntoreAI",
  description: "AI-powered talent screening platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

