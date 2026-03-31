"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { TaskStatus } from "@/lib/api/types";
import type { KanbanColumn as KanbanColumnType, KanbanTask } from "@/lib/kanban/mock-data";
import { KanbanTaskCard } from "@/ui/kanban/kanban-task-card";

export function KanbanColumn({
  column,
  tasks,
  onCreateTask,
  onEditTask,
  onOpenTaskDetails,
  onOpenComments,
  onDeleteTask,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  column: KanbanColumnType;
  tasks: KanbanTask[];
  onCreateTask?: (status: TaskStatus) => void;
  onEditTask?: (task: KanbanTask) => void;
  onOpenTaskDetails?: (taskId: string) => void;
  onOpenComments?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const droppableId = `col:${column.id}` satisfies `col:${TaskStatus}`;
  const { setNodeRef } = useDroppable({ id: droppableId });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastAutoLoadKeyRef = useRef<string | null>(null);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasMore) return;
      if (isLoadingMore) return;
      if (!onLoadMore) return;

      const el = e.currentTarget;
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (remaining > 240) return;

      onLoadMore();
    },
    [hasMore, isLoadingMore, onLoadMore],
  );

  useEffect(() => {
    if (!hasMore) return;
    if (isLoadingMore) return;
    if (!onLoadMore) return;

    const el = scrollRef.current;
    if (!el) return;

    // If the column can't scroll yet, auto-fetch additional pages so the user
    // doesn't get stuck with a non-triggering "scroll to load more".
    const canScroll = el.scrollHeight > el.clientHeight + 8;
    if (canScroll) return;

    const key = `${column.id}:${tasks.length}`;
    if (lastAutoLoadKeyRef.current === key) return;
    lastAutoLoadKeyRef.current = key;

    onLoadMore();
  }, [column.id, tasks.length, hasMore, isLoadingMore, onLoadMore]);

  return (
    <section className="flex w-[320px] shrink-0 flex-col rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <header className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{column.title}</div>
          <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{tasks.length} tasks</div>
        </div>
        {onCreateTask ? (
          <button
            type="button"
            className="h-8 rounded-xl border border-black/10 bg-white px-3 text-xs font-medium hover:bg-black/4 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6"
            onClick={() => onCreateTask(column.id)}
          >
            + Add
          </button>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {/* Droppable area */}
          <div
            ref={(el) => {
              scrollRef.current = el;
              setNodeRef(el);
            }}
            className="tm-scrollbar flex min-h-10 flex-col gap-3 overflow-y-auto pr-1"
            data-droppable-column={column.id}
            onScroll={handleScroll}
          >
            {tasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                onOpenDetails={onOpenTaskDetails}
                onEdit={onEditTask}
                onOpenComments={onOpenComments}
                onDelete={onDeleteTask}
              />
            ))}

            {tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/15 px-3 py-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
                Drop tasks here
              </div>
            ) : null}

            {hasMore ? (
              <div className="py-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {isLoadingMore ? "Loading more…" : "Scroll to load more"}
              </div>
            ) : null}
          </div>
        </SortableContext>
      </div>
    </section>
  );
}

