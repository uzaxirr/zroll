"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organization: { id: string; name: string };
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, companyName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storeTokens = useCallback((accessToken: string, refreshToken?: string) => {
    setToken(accessToken);
    setCookie("access_token", accessToken, 1);
    if (refreshToken) {
      setCookie("refresh_token", refreshToken, 7);
    }
  }, []);

  const fetchUser = useCallback(async (accessToken: string) => {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    const data = await res.json();
    setUser(data);
    setToken(accessToken);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = getCookie("refresh_token");
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      storeTokens(data.access_token);
      return data.access_token;
    } catch {
      return null;
    }
  }, [storeTokens]);

  // Initialize auth state on mount
  useEffect(() => {
    const init = async () => {
      const existingToken = getCookie("access_token");
      if (existingToken) {
        try {
          await fetchUser(existingToken);
        } catch {
          // Token expired, try refresh
          const newToken = await refreshAccessToken();
          if (newToken) {
            try { await fetchUser(newToken); } catch { logout(); }
          }
        }
      }
      setIsLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh timer
  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiresIn = payload.exp * 1000 - Date.now() - 60000; // refresh 1 min before expiry
      if (expiresIn <= 0) return;
      const timer = setTimeout(async () => {
        const newToken = await refreshAccessToken();
        if (newToken) await fetchUser(newToken);
      }, expiresIn);
      return () => clearTimeout(timer);
    } catch { return; }
  }, [token, refreshAccessToken, fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    storeTokens(data.access_token, data.refresh_token);
    await fetchUser(data.access_token);
  }, [storeTokens, fetchUser]);

  const signup = useCallback(async (name: string, email: string, password: string, companyName: string) => {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, company_name: companyName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Signup failed" }));
      throw new Error(err.detail || "Signup failed");
    }
    const data = await res.json();
    storeTokens(data.access_token, data.refresh_token);
    await fetchUser(data.access_token);
  }, [storeTokens, fetchUser]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    deleteCookie("access_token");
    deleteCookie("refresh_token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContextProvider");
  return ctx;
}
