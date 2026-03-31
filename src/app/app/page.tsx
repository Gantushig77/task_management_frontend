"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";

export default function AppHome() {
  const { session } = useAuth();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight">Your workspaces</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Backend wiring for Workspace/Board CRUD is next. For now, use the demo board to
          see Kanban drag-and-drop.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <div className="text-sm font-medium">Signed in</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {session
                ? session.user?.username ?? session.user?.name ?? session.user?.email ?? "User"
                : "No session"}
            </div>
          </div>

          <Link
            className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:bg-black/2 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/4"
            href="/app/demo-board"
          >
            <div className="text-sm font-medium">Open demo Kanban board</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Drag tasks between columns.
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

