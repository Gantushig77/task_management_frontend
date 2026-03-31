"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HttpError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export default function ResetPasswordPage() {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().includes("@") && !isLoading,
    [email, isLoading],
  );

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            We’ll email you reset instructions.
          </p>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSubmit) return;
            setError(null);
            setDone(false);
            try {
              await resetPassword(email.trim());
              setDone(true);
            } catch (err) {
              if (err instanceof HttpError) setError(err.message);
              else setError("Request failed.");
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

          {done ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
              If an account exists for that email, you’ll receive instructions shortly.
            </div>
          ) : null}

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
            {isLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-end text-sm">
          <Link className="text-zinc-700 hover:underline dark:text-zinc-300" href="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

