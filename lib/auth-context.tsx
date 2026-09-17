"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "applicant" | "recruiter";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string, role?: "applicant" | "recruiter") => Promise<void>;
  register: (username: string, firstName: string, lastName: string, email: string, password: string, role: "applicant" | "recruiter") => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "umurava_token";
const USER_KEY = "umurava_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        try {
          const { api } = await import("./api");
          const { user: freshUser } = await api.auth.me(storedToken);
          setUser(freshUser);
          localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        } catch (err) {
          console.error("Failed to refresh user session:", err);
          // If the token is invalid, we might want to logout
          // but for now we'll just keep the stored user if any
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string, role?: "applicant" | "recruiter") => {
    const { api } = await import("./api");
    const response = await api.auth.login({ emailOrUsername, password });
    
    if (role && response.user.role !== role) {
      throw new Error(`This account is registered as an ${response.user.role}. Please login as ${response.user.role} or create a new ${role} account.`);
    }

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    
    setToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (username: string, firstName: string, lastName: string, email: string, password: string, role: "applicant" | "recruiter") => {
    const { api } = await import("./api");
    const response = await api.auth.register({ username, firstName, lastName, email, password, role });
    
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    
    setToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    window.location.assign("/login");
  }, []);

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedUser };
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
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
