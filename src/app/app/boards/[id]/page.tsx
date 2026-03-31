'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HttpError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import type { Assignee, Task } from '@/lib/api/types';
import {
  useApi,
  useBoard,
  useInfiniteTasks,
  useUpdateTask,
  useWorkspaceMembers,
} from '@/lib/api/hooks';
import { useToast } from '@/ui/toast/toast-provider';
import { KANBAN_COLUMNS, type KanbanTask } from '@/lib/kanban/mock-data';
import { KanbanColumn } from '@/ui/kanban/kanban-column';
import { KanbanTaskCard } from '@/ui/kanban/kanban-task-card';
import { TaskDialog } from '@/ui/tasks/task-dialog';
import { CommentsDialog } from '@/ui/comments/comments-dialog';
import { TaskDetailDialog } from '@/ui/tasks/task-detail-dialog';

export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const auth = useAuth();
  const api = useApi();
  const boardQuery = useBoard(id);
  const tasksQuery = useInfiniteTasks(id, 5);
  const updateTask = useUpdateTask();
  const membersQuery = useWorkspaceMembers(boardQuery.data?.workspaceId ?? '');

  const [uiTasks, setUiTasks] = useState<Task[]>([]);
  const dragSnapshotRef = useRef<Task[] | null>(null);
  const dragStartStatusRef = useRef<Record<string, Task['status']>>({});
  const loadMoreLockRef = useRef(false);
  const loadMoreCooldownUntilRef = useRef(0);
  const loadMoreQueuedRef = useRef(false);
  const loadMoreTimerRef = useRef<number | null>(null);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [commentsTaskId, setCommentsTaskId] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [detailsTaskId, setDetailsTaskId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const allTasks = useMemo(() => {
    const pages = tasksQuery.data?.pages ?? [];
    return pages.flatMap((p: { items: Task[] }) => p.items ?? []);
  }, [tasksQuery.data]);

  useEffect(() => {
    // Keep UI state in sync with server state when not actively dragging.
    if (activeTaskId) return;
    if (tasksQuery.isFetching) return;
    setUiTasks(allTasks);
  }, [allTasks, tasksQuery.isFetching, activeTaskId]);

  const tasks = useMemo(() => uiTasks, [uiTasks]);
  const backHref = boardQuery.data?.workspaceId
    ? `/app/workspaces/${boardQuery.data.workspaceId}`
    : '/app';
  const kanbanTasks = useMemo<KanbanTask[]>(
    () =>
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description ?? undefined,
        status: (t.status as Task['status']) ?? 'todo',
        dueAt: t.dueAt ?? null,
        assignee: t.assignee ? { name: t.assignee.name, email: t.assignee.email } : null,
      })),
    [tasks],
  );

  const activeTask = useMemo(
    () =>
      activeTaskId ? (kanbanTasks.find((t) => t.id === activeTaskId) ?? null) : null,
    [activeTaskId, kanbanTasks],
  );

  function byColumn(status: string) {
    return kanbanTasks.filter((t) => t.status === status);
  }

  function updateUiTaskStatus(taskId: string, nextStatus: string) {
    setUiTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: nextStatus as Task['status'] } : t,
      ),
    );
  }

  function resolveNextStatus(overId: string | null): string | null {
    if (!overId) return null;
    if (overId.startsWith('col:')) return overId.replace('col:', '');
    const overTask = tasks.find((t) => t.id === overId);
    return overTask?.status ?? null;
  }

  function requestNextPage() {
    const now = Date.now();

    if (!tasksQuery.hasNextPage) return;
    if (tasksQuery.isFetchingNextPage) return;

    if (loadMoreLockRef.current) {
      loadMoreQueuedRef.current = true;
      return;
    }

    if (now < loadMoreCooldownUntilRef.current) {
      loadMoreQueuedRef.current = true;
      if (loadMoreTimerRef.current) return;
      loadMoreTimerRef.current = window.setTimeout(() => {
        loadMoreTimerRef.current = null;
        if (loadMoreQueuedRef.current) {
          loadMoreQueuedRef.current = false;
          requestNextPage();
        }
      }, Math.max(0, loadMoreCooldownUntilRef.current - now));
      return;
    }

    loadMoreLockRef.current = true;
    loadMoreCooldownUntilRef.current = now + 600;

    void tasksQuery
      .fetchNextPage()
      .catch(() => {
        // errors are already surfaced via tasksQuery.isError / toast elsewhere
      })
      .finally(() => {
        loadMoreLockRef.current = false;
        if (loadMoreQueuedRef.current) {
          loadMoreQueuedRef.current = false;
          requestNextPage();
        }
      });
  }

  return (
    <div className='flex flex-1 flex-col bg-zinc-50 px-6 py-10 dark:bg-black'>
      <div className='mx-auto w-full max-w-6xl'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              {boardQuery.data?.name ?? 'Board'}
            </h1>
            <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>{id}</p>
          </div>
          <Link
            href={backHref}
            className='inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium leading-none hover:bg-black/4 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6'
          >
            Back
          </Link>
        </div>

        <div className='mt-6 flex items-center justify-between'>
          <div className='text-sm text-zinc-600 dark:text-zinc-400'>
            {tasksQuery.isLoading ? 'Loading tasks…' : `${kanbanTasks.length} tasks`}
          </div>
          <button
            type='button'
            className='h-9 rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200'
            onClick={() => {
              setEditorError(null);
              setEditId(null);
              setIsEditorOpen(true);
            }}
          >
            + New task
          </button>
        </div>

        {tasksQuery.isError ? (
          <div className='mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300'>
            Failed to load tasks.
          </div>
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e: DragStartEvent) => {
            const activeId = String(e.active.id);
            dragSnapshotRef.current = tasks;
            const current = tasks.find((t) => t.id === activeId);
            if (current) dragStartStatusRef.current[activeId] = current.status;
            setActiveTaskId(activeId);
          }}
          onDragOver={(e: DragOverEvent) => {
            const activeId = String(e.active.id);
            const overId = e.over?.id ? String(e.over.id) : null;
            const nextStatus = resolveNextStatus(overId);
            if (!nextStatus) return;
            const task = tasks.find((t) => t.id === activeId);
            if (!task) return;
            if (task.status === nextStatus) return;
            updateUiTaskStatus(activeId, nextStatus);
          }}
          onDragEnd={async (e: DragEndEvent) => {
            setActiveTaskId(null);
            const activeId = String(e.active.id);
            const overId = e.over?.id ? String(e.over.id) : null;
            if (!overId) return;

            const task = tasks.find((t) => t.id === activeId);
            if (!task) return;

            const nextStatus = resolveNextStatus(overId);

            const startStatus = dragStartStatusRef.current[activeId];
            // Compare against the status at drag start (not the optimistic UI status).
            if (!nextStatus || nextStatus === startStatus) return;

            try {
              // Keep UI updated immediately after drop.
              updateUiTaskStatus(task.id, nextStatus);
              const updated = await updateTask.mutateAsync({
                id: task.id,
                input: {
                  title: task.title,
                  description: task.description ?? undefined,
                  status: nextStatus,
                  dueAt: task.dueAt ?? null,
                  assignedToUserId: task.assignedToUserId ?? null,
                },
              });
              toast.show('Task updated.');
              // Merge authoritative server result; avoid refetch flicker/ghost.
              setUiTasks((prev) =>
                prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
              );
            } catch (err) {
              // Rollback UI.
              if (dragSnapshotRef.current) setUiTasks(dragSnapshotRef.current);
              toast.show(err instanceof HttpError ? err.message : 'Failed to move task.');
            } finally {
              delete dragStartStatusRef.current[activeId];
            }
          }}
          onDragCancel={() => {
            setActiveTaskId(null);
            if (dragSnapshotRef.current) setUiTasks(dragSnapshotRef.current);
            if (activeTaskId) delete dragStartStatusRef.current[activeTaskId];
          }}
        >
          <div className='tm-scrollbar mt-4 flex w-full gap-4 overflow-x-auto pb-2'>
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={byColumn(col.id)}
                onCreateTask={() => {
                  setEditorError(null);
                  setEditId(null);
                  setIsEditorOpen(true);
                }}
                onEditTask={(task) => {
                  setEditorError(null);
                  setEditId(task.id);
                  setIsEditorOpen(true);
                }}
                onOpenTaskDetails={(taskId) => {
                  setDetailsTaskId(taskId);
                  setIsDetailsOpen(true);
                }}
                onOpenComments={(taskId) => {
                  setCommentsTaskId(taskId);
                  setIsCommentsOpen(true);
                }}
                onDeleteTask={async (taskId) => {
                  const ok = window.confirm('Delete this task?');
                  if (!ok) return;
                  try {
                    await api.task.remove(taskId);
                    toast.show('Task deleted.');
                    tasksQuery.refetch();
                  } catch (err) {
                    toast.show(
                      err instanceof HttpError ? err.message : 'Failed to delete task.',
                    );
                  }
                }}
                hasMore={tasksQuery.hasNextPage}
                isLoadingMore={tasksQuery.isFetchingNextPage}
                onLoadMore={() => {
                  requestNextPage();
                }}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <KanbanTaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskDialog
        title={editId ? 'Edit task' : 'Create task'}
        initialTitle={editId ? tasks.find((t) => t.id === editId)?.title : ''}
        initialDescription={
          editId ? (tasks.find((t) => t.id === editId)?.description ?? '') : ''
        }
        initialStatus={
          editId ? (tasks.find((t) => t.id === editId)?.status ?? 'todo') : 'todo'
        }
        initialDueAt={editId ? (tasks.find((t) => t.id === editId)?.dueAt ?? null) : null}
        initialAssignedToUserId={
          editId
            ? (tasks.find((t) => t.id === editId)?.assignedToUserId ??
              auth.session?.user?.id ??
              null)
            : (auth.session?.user?.id ?? null)
        }
        assignees={(membersQuery.data ?? []).map((m: { user: Assignee }) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
        }))}
        isOpen={isEditorOpen}
        isSubmitting={false}
        error={editorError}
        onClose={() => setIsEditorOpen(false)}
        onConfirm={async (input) => {
          setEditorError(null);
          try {
            if (editId) {
              await updateTask.mutateAsync({
                id: editId,
                input,
              });
              toast.show('Task updated.');
            } else {
              await api.task.create({
                boardId: id,
                ...input,
                assignedToUserId:
                  input.assignedToUserId && input.assignedToUserId.trim()
                    ? input.assignedToUserId
                    : (auth.session?.user?.id ?? input.assignedToUserId),
              });
              toast.show('Task created.');
            }
            setIsEditorOpen(false);
            tasksQuery.refetch();
          } catch (e) {
            if (e instanceof HttpError) setEditorError(e.message);
            else setEditorError('Failed to save task.');
          }
        }}
      />

      <CommentsDialog
        taskId={commentsTaskId}
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
      />

      <TaskDetailDialog
        task={
          detailsTaskId
            ? (tasks.find((t) => t.id === detailsTaskId) ?? null)
            : null
        }
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}
