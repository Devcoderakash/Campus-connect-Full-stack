/**
 * src/context/AuthContext.tsx
 *
 * Global authentication state for Campus Connect.
 *
 * Responsibilities:
 *  - Persist the JWT + user object in localStorage so refresh doesn't log out
 *  - Expose login / googleLogin / logout helpers
 *  - Provide `user`, `token`, and `isAuthenticated` to the whole app tree
 *
 * Uses the native-fetch `api` client (NOT axios) so this file is safe to
 * import in SSR / Bun contexts without triggering the follow-redirects crash.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  role: "Junior" | "Senior" | "Admin";
  branch: string;
  year: number;
  skills: string[];
  bio?: string;
  visibility?: boolean;
  isMentorAvailable?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (accessToken: string, googleProfile?: any) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

// ── Storage keys ───────────────────────────────────────────────────────────

const TOKEN_KEY = "cc_token";
const USER_KEY = "cc_user";

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof localStorage === "undefined") return null;
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Persist token
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  // Persist user
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  // Handle 401 Auto-Logout
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  // ── Traditional email/password login ──────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data: any = await api.post("/auth/login", { email, password });
      setToken(data.token);
      setUser(
        data.user ?? {
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          branch: data.branch ?? "",
          year: data.year ?? 1,
          skills: data.skills ?? [],
        },
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Google OAuth login ────────────────────────────────────────────────
  const googleLogin = useCallback(async (accessToken: string, googleProfile?: any) => {
    setIsLoading(true);
    try {
      let payload: Record<string, any>;

      if (googleProfile) {
        // Implicit flow — frontend already has the Google profile
        payload = {
          googleProfile: {
            sub: googleProfile.sub,
            name: googleProfile.name,
            email: googleProfile.email,
            picture: googleProfile.picture,
          },
        };
      } else {
        // ID token flow (One Tap / GoogleLogin button)
        payload = { credential: accessToken };
      }

      const data: any = await api.post("/auth/google-login", payload);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // ── Refetch Profile ───────────────────────────────────────────────────
  const refetchUser = useCallback(async () => {
    try {
      const data = await api.get<AuthUser>("/users/profile");
      setUser(data);
    } catch (err) {
      console.error("[AuthContext] Failed to refetch user:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        googleLogin,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
