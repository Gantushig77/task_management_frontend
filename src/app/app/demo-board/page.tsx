"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import type { TaskStatus } from "@/lib/api/types";
import { KANBAN_COLUMNS, MOCK_TASKS, type KanbanTask } from "@/lib/kanban/mock-data";
import { KanbanColumn } from "@/ui/kanban/kanban-column";
import { KanbanTaskCard } from "@/ui/kanban/kanban-task-card";

type TaskId = KanbanTask["id"];

function isTaskId(id: unknown): id is TaskId {
  return typeof id === "string" && id.startsWith("t-");
}

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function byColumn(tasks: KanbanTask[], status: TaskStatus): KanbanTask[] {
  return tasks.filter((t) => t.status === status);
}

function nextId(tasks: KanbanTask[]): string {
  const max = tasks.reduce((acc, t) => {
    const n = Number(t.id.replace("t-", ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `t-${max + 1}`;
}

export default function DemoBoardPage() {
  const [tasks, setTasks] = useState<KanbanTask[]>(() => MOCK_TASKS);
  const [activeTaskId, setActiveTaskId] = useState<TaskId | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<TaskStatus>("todo");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeTask = useMemo(
    () => (activeTaskId ? tasks.find((t) => t.id === activeTaskId) ?? null : null),
    [activeTaskId, tasks],
  );

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <div className="border-b border-black/10 bg-white px-6 py-4 dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Demo Kanban board</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Drag tasks between columns. This is mock data for now.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">{tasks.length} tasks</div>
            <button
              type="button"
              className="h-9 rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              onClick={() => {
                setEditId(null);
                setDraftStatus("todo");
                setDraftTitle("");
                setDraftDescription("");
                setIsEditorOpen(true);
              }}
            >
              + New task
            </button>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e: DragStartEvent) => {
          if (isTaskId(e.active.id)) setActiveTaskId(e.active.id);
        }}
        onDragOver={(e: DragOverEvent) => {
          const activeId = e.active.id;
          const overId = e.over?.id;
          if (!isTaskId(activeId) || !overId) return;

          // When hovering over a column, move the task into that column (end).
          if (typeof overId === "string" && overId.startsWith("col:")) {
            const nextStatus = overId.replace("col:", "") as TaskStatus;
            setTasks((prev) => {
              const idx = prev.findIndex((t) => t.id === activeId);
              if (idx < 0) return prev;
              if (prev[idx]!.status === nextStatus) return prev;
              const next = prev.slice();
              next[idx] = { ...next[idx]!, status: nextStatus };
              return next;
            });
            return;
          }

          // When hovering over another task, potentially reorder and/or change column.
          if (isTaskId(overId)) {
            setTasks((prev) => {
              const fromIndex = prev.findIndex((t) => t.id === activeId);
              const toIndex = prev.findIndex((t) => t.id === overId);
              if (fromIndex < 0 || toIndex < 0) return prev;

              const from = prev[fromIndex]!;
              const over = prev[toIndex]!;
              const next = prev.slice();

              // If crossing columns, update status first, then reorder by array position.
              if (from.status !== over.status) next[fromIndex] = { ...from, status: over.status };

              return reorder(next, fromIndex, toIndex);
            });
          }
        }}
        onDragEnd={(e: DragEndEvent) => {
          setActiveTaskId(null);

          const activeId = e.active.id;
          const overId = e.over?.id;
          if (!isTaskId(activeId) || !overId) return;

          // Final normalization pass: keep relative ordering within each column.
          setTasks((prev) => {
            const next: KanbanTask[] = [];
            for (const col of KANBAN_COLUMNS) {
              next.push(...byColumn(prev, col.id));
            }
            return next;
          });
        }}
        onDragCancel={() => setActiveTaskId(null)}
      >
        <div className="tm-scrollbar mx-auto flex w-full max-w-6xl flex-1 gap-4 overflow-x-auto px-6 py-6">
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={byColumn(tasks, col.id)}
              onCreateTask={(status) => {
                setEditId(null);
                setDraftStatus(status);
                setDraftTitle("");
                setDraftDescription("");
                setIsEditorOpen(true);
              }}
              onEditTask={(task) => {
                setEditId(task.id);
                setDraftStatus(task.status);
                setDraftTitle(task.title);
                setDraftDescription(task.description ?? "");
                setIsEditorOpen(true);
              }}
              onDeleteTask={(taskId) => {
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <KanbanTaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {isEditorOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onMouseDown={() => setIsEditorOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-950"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">
                  {editId ? "Edit task" : "Create task"}
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Mock CRUD for now; later this will call your Task API.
                </div>
              </div>
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-sm hover:bg-black/4 dark:hover:bg-white/6"
                onClick={() => setIsEditorOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Title</span>
                <input
                  className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="e.g. Implement task CRUD"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Description</span>
                <textarea
                  className="min-h-24 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Status</span>
                <select
                  className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as TaskStatus)}
                >
                  {KANBAN_COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="h-10 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-black/4 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6"
                onClick={() => setIsEditorOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-10 rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-60 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                disabled={draftTitle.trim().length === 0}
                onClick={() => {
                  const title = draftTitle.trim();
                  const description = draftDescription.trim() || undefined;

                  setTasks((prev) => {
                    if (editId) {
                      return prev.map((t) =>
                        t.id === editId ? { ...t, title, description, status: draftStatus } : t,
                      );
                    }
                    const id = nextId(prev);
                    return [...prev, { id, title, description, status: draftStatus }];
                  });
                  setIsEditorOpen(false);
                }}
              >
                {editId ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

