'use client';

import type { Assignee, Task } from '@/lib/api/types';

function formatDateTime(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export function TaskDetailDialog({
  task,
  isOpen,
  onClose,
}: {
  task: (Pick<Task, 'id' | 'title' | 'description' | 'status' | 'dueAt'> & {
    assignee?: Assignee | null;
  }) | null;
  isOpen: boolean;
  onClose: () => void;
}) {
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
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{task?.title ?? 'Task'}</div>
            {task?.id ? (
              <div className="mt-1 truncate text-xs text-zinc-600 dark:text-zinc-400">
                {task.id}
              </div>
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

        <div className="mt-4 flex flex-col gap-3 text-sm">
          <div className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs font-semibold">Description</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-100">
              {task?.description?.trim() ? task.description : '—'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
              <div className="text-xs font-semibold">Status</div>
              <div className="mt-1 text-sm text-zinc-800 dark:text-zinc-100">
                {task?.status ?? '—'}
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
              <div className="text-xs font-semibold">Due</div>
              <div className="mt-1 text-sm text-zinc-800 dark:text-zinc-100">
                {formatDateTime(task?.dueAt ?? null) ?? '—'}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs font-semibold">Assignee</div>
            <div className="mt-1 text-sm text-zinc-800 dark:text-zinc-100">
              {task?.assignee ? `${task.assignee.name} (${task.assignee.email})` : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

