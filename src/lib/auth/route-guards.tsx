"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    if (!session) router.replace("/login");
  }, [isHydrated, session, router]);

  if (!isHydrated) return null;
  if (!session) return null;
  return children;
}

export function RedirectIfAuthed({ to }: { to: string }) {
  const router = useRouter();
  const { session, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    if (session) router.replace(to);
  }, [isHydrated, session, router, to]);

  return null;
}

