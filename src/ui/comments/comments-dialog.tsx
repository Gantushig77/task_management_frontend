"use client";

import { useEffect, useMemo, useState } from "react";
import { useComments, useCreateComment, useDeleteComment } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";

export function CommentsDialog({
  taskId,
  isOpen,
  onClose,
}: {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id ?? null;
  const commentsQuery = useComments(taskId ?? "");
  const createComment = useCreateComment(taskId ?? "");
  const deleteComment = useDeleteComment(taskId ?? "");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (!taskId) return;
    void commentsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskId]);

  useEffect(() => {
    if (!isOpen) return;
    setBody("");
  }, [isOpen]);

  const title = useMemo(() => (taskId ? "Comments" : "Comments"), [taskId]);
  const canPost = !!taskId && body.trim().length > 0 && !createComment.isPending;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-950"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            {taskId ? (
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{taskId}</div>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-sm hover:bg-black/4 dark:hover:bg-white/6"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold">List</div>
            <button
              type="button"
              className="h-8 rounded-xl px-3 text-xs hover:bg-black/4 disabled:opacity-60 dark:hover:bg-white/6"
              disabled={commentsQuery.isFetching || !taskId}
              onClick={() => commentsQuery.refetch()}
            >
              Refresh
            </button>
          </div>

          <div className="mt-2">
            {!taskId ? (
              <div className="text-xs text-zinc-600 dark:text-zinc-400">No task selected.</div>
            ) : commentsQuery.isLoading ? (
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Loading…</div>
            ) : commentsQuery.isError ? (
              <div className="text-xs text-red-700 dark:text-red-300">Failed to load comments.</div>
            ) : (commentsQuery.data?.length ?? 0) === 0 ? (
              <div className="text-xs text-zinc-600 dark:text-zinc-400">No comments yet.</div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-auto pr-1">
                {(commentsQuery.data ?? []).map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-black/10 bg-black/2 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
                          {c.author?.name ?? "Unknown"}
                          {c.author?.email ? (
                            <span className="text-zinc-500 dark:text-zinc-400"> ({c.author.email})</span>
                          ) : null}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap">{c.body}</div>
                      </div>
                      {taskId &&
                      currentUserId &&
                      (c.author?.id === currentUserId ||
                        (c.createdByUserId ?? null) === currentUserId) ? (
                        <button
                          type="button"
                          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-500/10 disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-500/15"
                          disabled={deleteComment.isPending}
                          onClick={async () => {
                            const ok = window.confirm("Delete this comment?");
                            if (!ok) return;
                            await deleteComment.mutateAsync(c.id);
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-black/10 pt-3 dark:border-white/10">
            <div className="text-xs font-semibold">Add comment</div>
            <textarea
              className="mt-2 min-h-20 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment…"
              disabled={!taskId}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              {createComment.isError ? (
                <div className="text-xs text-red-700 dark:text-red-300">Failed to post comment.</div>
              ) : (
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  {createComment.isPending ? "Posting…" : " "}
                </div>
              )}
              <button
                type="button"
                className="h-9 rounded-xl bg-black px-3 text-xs font-medium text-white disabled:opacity-60 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                disabled={!canPost}
                onClick={async () => {
                  const trimmed = body.trim();
                  if (!trimmed || !taskId) return;
                  await createComment.mutateAsync({ body: trimmed });
                  setBody("");
                }}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

