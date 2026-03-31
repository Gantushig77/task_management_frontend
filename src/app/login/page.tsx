"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { HttpError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { ADMIN_CREDENTIALS, DEMO_CREDENTIALS, isMockAuthEnabled } from "@/lib/auth/mock-auth";
import { RedirectIfAuthed } from "@/lib/auth/route-guards";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0 && !isLoading,
    [email, password, isLoading],
  );

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <RedirectIfAuthed to="/app" />
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Welcome back. Enter your credentials.
          </p>
          {isMockAuthEnabled() ? (
            <div className="mt-3 rounded-xl border border-black/10 bg-black/2 px-3 py-2 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/6 dark:text-zinc-200">
              Demo logins:{" "}
              <button
                type="button"
                className="font-mono underline underline-offset-2"
                onClick={() => {
                  setEmail(DEMO_CREDENTIALS.usernameOrEmail);
                  setPassword(DEMO_CREDENTIALS.password);
                }}
              >
                {DEMO_CREDENTIALS.usernameOrEmail} / {DEMO_CREDENTIALS.password}
              </button>
              {" · "}
              <button
                type="button"
                className="font-mono underline underline-offset-2"
                onClick={() => {
                  setEmail(ADMIN_CREDENTIALS.usernameOrEmail);
                  setPassword(ADMIN_CREDENTIALS.password);
                }}
              >
                {ADMIN_CREDENTIALS.usernameOrEmail} / {ADMIN_CREDENTIALS.password}
              </button>
            </div>
          ) : null}
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSubmit) return;
            setError(null);
            try {
              await login(email.trim(), password);
              router.push("/app");
            } catch (err) {
              if (err instanceof HttpError) setError(err.message);
              else setError("Login failed.");
            }
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none ring-0 focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              name="email"
              type="email"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Password</span>
            <input
              className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none ring-0 focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              name="password"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <button
            className="h-11 rounded-xl bg-black text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
            type="submit"
            disabled={!canSubmit}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link className="text-zinc-700 hover:underline dark:text-zinc-300" href="/reset-password">
            Forgot password?
          </Link>
          <Link className="text-zinc-700 hover:underline dark:text-zinc-300" href="/register">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

