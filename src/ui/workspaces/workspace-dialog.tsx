"use client";

import { useEffect, useMemo, useState } from "react";

export function WorkspaceDialog({
  title,
  initialName,
  confirmLabel,
  isOpen,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: {
  title: string;
  initialName?: string;
  confirmLabel: string;
  isOpen: boolean;
  isSubmitting: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState(initialName ?? "");

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName ?? "");
  }, [isOpen, initialName]);

  const canSubmit = useMemo(() => name.trim().length >= 2 && !isSubmitting, [name, isSubmitting]);

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
              Name must be at least 2 characters.
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
            <span className="text-xs font-medium">Workspace name</span>
            <input
              className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My team"
              autoFocus
            />
          </label>

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
            onClick={() => onConfirm(name.trim())}
          >
            {isSubmitting ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

