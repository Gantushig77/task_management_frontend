"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { HttpError } from "@/lib/api/client";
import { ApiClient } from "@/lib/api/client";
import { createApi } from "@/lib/api/endpoints";
import type { AuthSession } from "@/lib/api/types";
import { isMockAuthEnabled, mockLogin, mockRegister } from "@/lib/auth/mock-auth";
import { loadSession, saveSession } from "@/lib/auth/storage";

type AuthState = {
  session: AuthSession | null;
  isHydrated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function authHeaderFromSession(session: AuthSession | null): string | null {
  const token = session?.tokens?.accessToken;
  if (!token) return null;
  return `Bearer ${token}`;
}

function normalizeAuthResponseToSession(input: AuthSession, fallbackUser?: AuthSession["user"]): AuthSession {
  return {
    user: input.user ?? fallbackUser,
    tokens: {
      accessToken: input.tokens.accessToken,
      expiresAt: input.tokens.expiresAt,
      refreshToken: input.tokens.refreshToken,
    },
  };
}

function shouldFallbackToMock(err: unknown): boolean {
  // Only use mock fallback when backend is unreachable (network error),
  // not when backend responded with a real HTTP error (e.g. 409 conflict).
  if (!isMockAuthEnabled()) return false;
  if (err instanceof HttpError) return false;
  return true;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Important: keep initial render identical between server + client to avoid hydration mismatches.
  // We hydrate from localStorage after mount.
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setIsHydrated(true);
  }, []);

  // Once hydrated, if we have a token but no user payload yet, fetch /me.
  useEffect(() => {
    if (!isHydrated) return;
    if (!session?.tokens?.accessToken) return;
    if (session.user?.id) return;

    let cancelled = false;
    (async () => {
      try {
        const me = await api.users.me();
        if (cancelled) return;
        setAndPersist({
          ...session,
          user: {
            id: me.id,
            email: me.email,
            name: me.name,
            role: me.role === "admin" ? "admin" : "user",
            emailVerifiedAt: me.email_verified_at ?? null,
            createdAt: me.created_at,
            updatedAt: me.updated_at,
          },
        });
      } catch {
        // If token is invalid/expired, clear session so route guards send user to /login.
        if (cancelled) return;
        setAndPersist(null);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, session?.tokens?.accessToken]);

  const client = useMemo(
    () =>
      new ApiClient({
        getAuthHeader: () => authHeaderFromSession(session),
      }),
    [session],
  );
  const api = useMemo(() => createApi(client), [client]);

  const setAndPersist = useCallback((next: AuthSession | null) => {
    setSession(next);
    saveSession(next);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        try {
          const next = await api.auth.login({ email, password });
          setAndPersist(
            normalizeAuthResponseToSession(next, {
              email,
            }),
          );
        } catch (err) {
          if (!shouldFallbackToMock(err)) throw err;
          const next = mockLogin(email, password);
          setAndPersist(next);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [api, setAndPersist],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        try {
          const next = await api.auth.register({ name, email, password });
          setAndPersist(
            normalizeAuthResponseToSession(next, {
              name,
              email,
              role: "user",
            }),
          );
        } catch (err) {
          if (!shouldFallbackToMock(err)) throw err;
          // Password is intentionally ignored in mock mode.
          const next = mockRegister(name, email);
          setAndPersist(next);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [api, setAndPersist],
  );

  const resetPassword = useCallback(
    async (email: string) => {
      setIsLoading(true);
      try {
        await api.auth.resetPasswordRequest({ email });
      } finally {
        setIsLoading(false);
      }
    },
    [api],
  );

  const logout = useCallback(() => setAndPersist(null), [setAndPersist]);

  const value = useMemo<AuthState>(
    () => ({ session, isHydrated, isLoading, login, register, resetPassword, logout }),
    [session, isHydrated, isLoading, login, register, resetPassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function createAuthedApi(
  session: AuthSession | null,
  opts?: { onUnauthorized?: (err: HttpError) => void; onTooManyRequests?: (err: HttpError) => void },
) {
  const client = new ApiClient({
    getAuthHeader: () => authHeaderFromSession(session),
    onUnauthorized: opts?.onUnauthorized,
    onTooManyRequests: opts?.onTooManyRequests,
  });
  return createApi(client);
}

