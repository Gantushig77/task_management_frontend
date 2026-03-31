"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";

export default function Home() {
  const router = useRouter();
  const { session, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    router.replace(session ? "/app" : "/login");
  }, [router, session, isHydrated]);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">Redirecting…</div>
    </div>
  );
}
