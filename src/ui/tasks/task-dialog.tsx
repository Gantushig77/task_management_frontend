"use client";

import { useEffect, useMemo, useState } from "react";

type AssigneeOption = { id: string; name: string; email: string };

function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(v: string): string | undefined {
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return undefined;
  // RFC3339 (no milliseconds) e.g. 2026-03-31T12:34:56Z
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function TaskDialog({
  title,
  initialTitle,
  initialDescription,
  initialStatus,
  initialDueAt,
  initialAssignedToUserId,
  assignees,
  isOpen,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: {
  title: string;
  initialTitle?: string;
  initialDescription?: string;
  initialStatus: string;
  initialDueAt?: string | null;
  initialAssignedToUserId?: string | null;
  assignees?: AssigneeOption[];
  isOpen: boolean;
  isSubmitting: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (input: {
    title: string;
    description?: string;
    status: string;
    dueAt?: string | null;
    assignedToUserId?: string;
  }) => void;
}) {
  const [t, setT] = useState(initialTitle ?? "");
  const [d, setD] = useState(initialDescription ?? "");
  const [s, setS] = useState(initialStatus);
  const [dueLocal, setDueLocal] = useState(toDatetimeLocalValue(initialDueAt));
  const [assigneeId, setAssigneeId] = useState<string>(initialAssignedToUserId ?? "");

  useEffect(() => {
    if (!isOpen) return;
    setT(initialTitle ?? "");
    setD(initialDescription ?? "");
    setS(initialStatus);
    setDueLocal(toDatetimeLocalValue(initialDueAt));
    setAssigneeId(initialAssignedToUserId ?? "");
  }, [isOpen, initialTitle, initialDescription, initialStatus, initialDueAt, initialAssignedToUserId]);

  useEffect(() => {
    if (!isOpen) return;
    if (assigneeId) return;
    if (!assignees?.length) return;
    setAssigneeId(assignees[0]?.id ?? "");
  }, [isOpen, assigneeId, assignees]);

  const canSubmit = useMemo(() => t.trim().length >= 2 && !isSubmitting, [t, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-950"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Title must be at least 2 characters.
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

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium">Title</span>
            <input
              className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
              value={t}
              onChange={(e) => setT(e.target.value)}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium">Description</span>
            <textarea
              className="min-h-24 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
              value={d}
              onChange={(e) => setD(e.target.value)}
              placeholder="Optional"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium">Status</span>
            <div className="relative">
              <select
                className="h-11 w-full appearance-none rounded-xl border border-black/10 bg-white px-3 pr-12 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
                value={s}
                onChange={(e) => setS(e.target.value)}
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
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
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium">Due date</span>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
                value={dueLocal}
                onChange={(e) => setDueLocal(e.target.value)}
              />
              <button
                type="button"
                className="h-11 shrink-0 rounded-xl border border-black/10 bg-white px-3 text-sm hover:bg-black/4 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6"
                onClick={() => setDueLocal("")}
              >
                Clear
              </button>
            </div>
          </label>

          {assignees && assignees.length ? (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">Assignee</span>
              <div className="relative">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-black/10 bg-white px-3 pr-12 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  {assignees.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
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
            </label>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            className="h-10 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-black/4 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-10 rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-60 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            disabled={!canSubmit}
            onClick={() =>
              onConfirm({
                title: t.trim(),
                description: d.trim() ? d.trim() : undefined,
                status: s,
                dueAt: dueLocal ? fromDatetimeLocalValue(dueLocal) ?? null : null,
                // Backend expects string; send empty string for "Unassigned" so it can clear.
                assignedToUserId: assigneeId,
              })
            }
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

