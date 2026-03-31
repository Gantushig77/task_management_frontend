"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { KanbanTask } from "@/lib/kanban/mock-data";

function statusPill(status: KanbanTask["status"]): { label: string; className: string } {
  switch (status) {
    case "todo":
      return { label: "To do", className: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200" };
    case "in_progress":
      return { label: "In progress", className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200" };
    case "done":
      return { label: "Done", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200" };
  }
}

export function KanbanTaskCard({
  task,
  isOverlay,
  onEdit,
  onDelete,
}: {
  task: KanbanTask;
  isOverlay?: boolean;
  onEdit?: (task: KanbanTask) => void;
  onDelete?: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !!isOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const pill = statusPill(task.status);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={[
        "rounded-2xl border border-black/10 bg-white p-3 shadow-sm",
        "dark:border-white/10 dark:bg-zinc-900/40",
        "select-none",
        isOverlay ? "shadow-lg" : "",
        isDragging ? "opacity-50" : "",
      ].join(" ")}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{task.title}</div>
          {task.description ? (
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
              {task.description}
            </div>
          ) : null}
          {!isOverlay && (onEdit || onDelete) ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              {onEdit ? (
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 hover:bg-black/4 dark:hover:bg-white/6"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  Edit
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-red-700 hover:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${pill.className}`}>
          {pill.label}
        </span>
      </div>
    </article>
  );
}

