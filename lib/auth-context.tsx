"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, type ApiError } from "./api";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "applicant" | "recruiter";
  createdAt: string;
  mfaEnabled?: boolean;
}

type Role = "applicant" | "recruiter";

/** "signed-in" or "mfa" (password accepted, authenticator code still needed). */
export type LoginOutcome = { status: "signed-in"; user: User } | { status: "mfa" };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string, options?: { role?: Role; captchaToken?: string }) => Promise<LoginOutcome>;
  verifyOtp: (code: string, role?: Role) => Promise<User>;
  register: (
    details: { username: string; firstName: string; lastName: string; email: string; password: string; role: Role; captchaToken?: string },
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Pre-cookie builds kept a bearer token here; scrub it so nothing XSS-readable lingers.
const LEGACY_KEYS = ["umurava_token", "umurava_user", "token"];

/**
 * Session state lives in an HttpOnly cookie that JavaScript can't read. The client only
 * keeps the user profile in memory and asks the server (`/auth/me`) who is signed in.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // storage blocked — nothing to scrub
    }
    api.auth
      .me()
      .then(({ user: current }) => setUser(current as User))
      .catch((err: ApiError) => {
        if (err.status !== 401) console.error("Failed to restore session:", err);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  /** The role picker is a convenience; a mismatched role ends the session it just opened. */
  const acceptUser = useCallback(async (signedIn: User, role?: Role) => {
    if (role && signedIn.role !== role) {
      await api.auth.logout().catch(() => undefined);
      throw new Error(`This account is registered as an ${signedIn.role}. Please login as ${signedIn.role} or create a new ${role} account.`);
    }
    setUser(signedIn);
    return signedIn;
  }, []);

  const login = useCallback<AuthContextType["login"]>(async (emailOrUsername, password, options = {}) => {
    const result = await api.auth.login({ emailOrUsername, password, captchaToken: options.captchaToken });
    if (result.mfaRequired) return { status: "mfa" };
    return { status: "signed-in", user: await acceptUser(result.user as User, options.role) };
  }, [acceptUser]);

  const verifyOtp = useCallback<AuthContextType["verifyOtp"]>(async (code, role) => {
    const { user: signedIn } = await api.auth.verifyOtp(code);
    return acceptUser(signedIn as User, role);
  }, [acceptUser]);

  const register = useCallback<AuthContextType["register"]>(async (details) => {
    const { user: created } = await api.auth.register(details);
    setUser(created as User);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => undefined);
    setUser(null);
    window.location.assign("/login");
  }, []);

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verifyOtp, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
