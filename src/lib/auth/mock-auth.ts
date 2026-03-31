import { getApiBaseUrl } from "@/lib/env";
import type { AuthSession } from "@/lib/api/types";

export const DEMO_CREDENTIALS = {
  usernameOrEmail: "demo",
  password: "demo123",
} as const;

export const ADMIN_CREDENTIALS = {
  usernameOrEmail: "admin",
  password: "admin123",
} as const;

export function isMockAuthEnabled(): boolean {
  // Enabled by default for local dev unless explicitly disabled.
  const flag = process.env.NEXT_PUBLIC_MOCK_AUTH;
  if (flag === "0" || flag === "false") return false;
  if (flag === "1" || flag === "true") return true;

  // Heuristic: if you're pointing at the default local backend URL, allow mock login.
  const base = getApiBaseUrl();
  // If using same-origin proxy ("/api"), treat as local dev.
  const isSameOriginProxy = base.startsWith("/");
  const isLocalBackend = base.includes("localhost") || base.includes("127.0.0.1") || isSameOriginProxy;
  return process.env.NODE_ENV !== "production" && isLocalBackend;
}

export function mockLogin(usernameOrEmail: string, password: string): AuthSession {
  const u = usernameOrEmail.trim();
  if (u === DEMO_CREDENTIALS.usernameOrEmail && password === DEMO_CREDENTIALS.password) {
    return {
      user: { id: "u-demo", username: "demo", name: "Demo User", email: "demo@example.com", role: "user" },
      tokens: { accessToken: "mock-access-token-demo", expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
    };
  }

  if (u === ADMIN_CREDENTIALS.usernameOrEmail && password === ADMIN_CREDENTIALS.password) {
    return {
      user: { id: "u-admin", username: "admin", name: "Admin User", email: "admin@example.com", role: "admin" },
      tokens: { accessToken: "mock-access-token-admin", expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
    };
  }

  throw new Error("Invalid credentials. Try demo / demo123 or admin / admin123.");
}

function usernameFromEmail(email: string): string | null {
  const at = email.indexOf("@");
  if (at <= 0) return null;
  return email.slice(0, at);
}

export function mockRegister(name: string, email: string): AuthSession {
  const n = name.trim() || "User";
  const u = usernameFromEmail(email.trim()) ?? n.toLowerCase().replace(/\s+/g, ".");
  return {
    user: { id: `u-${u.toLowerCase()}`, username: u, name: n, email, role: "user" },
    tokens: { accessToken: "mock-access-token-register", expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
  };
}

