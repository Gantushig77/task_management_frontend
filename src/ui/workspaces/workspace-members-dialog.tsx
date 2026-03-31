"use client";

import type { WorkspaceMember } from "@/lib/api/types";
import { useMemo, useState } from "react";
import { HttpError } from "@/lib/api/client";
import { useInviteWorkspaceMember } from "@/lib/api/hooks";
import { useToast } from "@/ui/toast/toast-provider";

export function WorkspaceMembersDialog({
  isOpen,
  isLoading,
  isError,
  workspaceId,
  members,
  loadedCountLabel,
  hasNextPage,
  isFetchingNextPage,
  errorMessage,
  onClose,
  onLoadMore,
}: {
  isOpen: boolean;
  isLoading: boolean;
  isError: boolean;
  workspaceId: string;
  members: WorkspaceMember[];
  loadedCountLabel: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  errorMessage?: string;
  onClose: () => void;
  onLoadMore: () => void;
}) {
  const toast = useToast();
  const invite = useInviteWorkspaceMember();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "owner">("member");
  const [inviteError, setInviteError] = useState<string | null>(null);

  const canInvite = useMemo(
    () => email.trim().includes("@") && !invite.isPending,
    [email, invite.isPending],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-950"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Workspace members</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {isLoading ? "Loading…" : loadedCountLabel}
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-sm hover:bg-black/4 dark:hover:bg-white/6"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-sm font-semibold">Invite member</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px_120px]">
            <input
              className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
            />
            <div className="relative">
              <select
                className="h-10 w-full appearance-none rounded-xl border border-black/10 bg-white px-3 pr-12 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
                value={role}
                onChange={(e) => setRole(e.target.value as "member" | "owner")}
              >
                <option value="member">member</option>
                <option value="owner">owner</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-500 dark:text-zinc-400">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M5.25 7.5a.75.75 0 0 1 1.06 0L10 11.19l3.69-3.69a.75.75 0 1 1 1.06 1.06l-4.22 4.22a.75.75 0 0 1-1.06 0L5.25 8.56a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </div>
            </div>
            <button
              type="button"
              className="h-10 rounded-xl bg-black px-3 text-sm font-medium text-white disabled:opacity-60 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              disabled={!canInvite}
              onClick={async () => {
                setInviteError(null);
                try {
                  await invite.mutateAsync({
                    workspaceId,
                    email: email.trim(),
                    role,
                  });
                  toast.show("Invitation sent.");
                  setEmail("");
                } catch (e) {
                  if (e instanceof HttpError) setInviteError(e.message);
                  else setInviteError("Failed to invite member.");
                }
              }}
            >
              {invite.isPending ? "Inviting…" : "Invite"}
            </button>
          </div>
          {inviteError ? (
            <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {inviteError}
            </div>
          ) : null}
        </div>

        {isError ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {errorMessage ?? "Failed to load members."}
          </div>
        ) : null}

        <div className="mt-4 flex max-h-[65vh] flex-col gap-2 overflow-auto pr-1 tm-scrollbar">
          {members.map((m) => (
            <div
              key={`${m.user.id}-${m.role}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{m.user.name}</div>
                <div className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                  {m.user.email}
                </div>
              </div>
              <div className="shrink-0 rounded-full border border-black/10 bg-black/2 px-2 py-1 text-[11px] font-medium dark:border-white/10 dark:bg-white/6">
                {m.role}
              </div>
            </div>
          ))}

          {!isLoading && members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/15 px-3 py-10 text-center text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-400">
              No members.
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {hasNextPage ? (
            <button
              type="button"
              className="h-9 rounded-xl border border-black/10 bg-white px-3 text-sm font-medium hover:bg-black/4 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6"
              onClick={onLoadMore}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

