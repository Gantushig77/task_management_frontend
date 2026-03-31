"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { TaskStatus } from "@/lib/api/types";
import type { KanbanColumn as KanbanColumnType, KanbanTask } from "@/lib/kanban/mock-data";
import { KanbanTaskCard } from "@/ui/kanban/kanban-task-card";

export function KanbanColumn({
  column,
  tasks,
  onCreateTask,
  onEditTask,
  onDeleteTask,
}: {
  column: KanbanColumnType;
  tasks: KanbanTask[];
  onCreateTask?: (status: TaskStatus) => void;
  onEditTask?: (task: KanbanTask) => void;
  onDeleteTask?: (taskId: string) => void;
}) {
  const droppableId = `col:${column.id}` satisfies `col:${TaskStatus}`;

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
            id={droppableId}
            className="flex min-h-10 flex-col gap-3"
            data-droppable-column={column.id}
          >
            {tasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}

            {tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/15 px-3 py-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
                Drop tasks here
              </div>
            ) : null}
          </div>
        </SortableContext>
      </div>
    </section>
  );
}

