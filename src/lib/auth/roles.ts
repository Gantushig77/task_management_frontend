import type { AuthSession } from "@/lib/api/types";

export function isAdmin(session: AuthSession | null): boolean {
  return session?.user?.role === "admin";
}

