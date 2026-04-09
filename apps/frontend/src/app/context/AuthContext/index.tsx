"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

interface User { id: string; email: string; firstName: string; lastName: string; role: string; }
interface AuthState { token: string | null; user: User | null; }
interface AuthContextValue extends AuthState { setAuth: (token: string, user: User) => void; clearAuth: () => void; }

const AuthContext = createContext<AuthContextValue>({ token: null, user: null, setAuth: () => {}, clearAuth: () => {} });

function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null });
  const router = useRouter();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0";
    setState({ token: null, user: null });
    router.push("/login");
  }, [router]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      clearAuth();
    }, IDLE_TIMEOUT_MS);
  }, [clearAuth]);

  // Start idle detection
  const startIdleDetection = useCallback(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdleTimer]);

  // Check JWT expiry every minute
  const startTokenCheck = useCallback((token: string) => {
    tokenCheckInterval.current = setInterval(() => {
      if (isTokenExpired(token)) {
        clearAuth();
      }
    }, 60 * 1000);
    return () => {
      if (tokenCheckInterval.current) clearInterval(tokenCheckInterval.current);
    };
  }, [clearAuth]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("user");
    console.log("🔍 AuthContext init - Token exists:", !!token, "User exists:", !!raw);

    // If no localStorage token but cookies exist (from OAuth), fetch user
    if (!token && !raw) {
      console.log("🔍 No localStorage token, checking for cookie-based auth...");
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            const nameParts = data.data.name.split(' ');
            const user = {
              id: data.data.id,
              email: data.data.email,
              firstName: nameParts[0],
              lastName: nameParts.slice(1).join(' ') || '',
              role: data.data.roles?.[0]?.role?.name || 'user',
            };
            console.log("✅ Cookie-based auth found, setting state");
            localStorage.setItem("user", JSON.stringify(user));
            setState({ token: 'cookie', user }); // token: 'cookie' indicates cookie-based auth
          }
        })
        .catch(err => console.log("ℹ️ No cookie auth:", err.message));
      return;
    }

    if (token && raw) {
      try {
        if (isTokenExpired(token)) {
          console.log("❌ Token expired at init");
          clearAuth();
          return;
        }
        console.log("✅ Token valid, setting auth state");
        setState({ token, user: JSON.parse(raw) });
        document.cookie = `token=${token}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax`;
      } catch (e) {
        console.error("❌ Error parsing token/user:", e);
      }
    }
  }, [clearAuth]);

  // Start idle + token check when logged in
  useEffect(() => {
    if (!state.token) return;
    const stopIdle = startIdleDetection();
    const stopTokenCheck = startTokenCheck(state.token);
    return () => {
      stopIdle();
      stopTokenCheck();
    };
  }, [state.token, startIdleDetection, startTokenCheck]);

  const setAuth = (token: string, user: User) => {
    console.log("🔐 setAuth called with user:", user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    document.cookie = `token=${token}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax`;
    console.log("💾 LocalStorage set, setState called");
    setState({ token, user });
  };

  return <AuthContext.Provider value={{ ...state, setAuth, clearAuth }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
