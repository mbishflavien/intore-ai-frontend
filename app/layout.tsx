import "./globals.css";
import type { ReactNode } from "react";
import { AuthProvider } from "../lib/auth-context";
import { ThemeProvider } from "../lib/theme";

export const metadata = {
  title: "IntoreAI",
  description: "AI-powered talent screening platform",
};

// Applies the persisted theme before first paint (no light-flash on reload).
const themeInitScript = `(function(){try{var t=localStorage.getItem("intore-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t==="dark"){document.documentElement.classList.add("dark");}document.documentElement.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

