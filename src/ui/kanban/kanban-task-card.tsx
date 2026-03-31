'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanTask } from '@/lib/kanban/mock-data';

function formatDue(dueAt: string): string {
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return dueAt;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d);
}

function statusPill(status: KanbanTask['status']): { label: string; className: string } {
  switch (status) {
    case 'todo':
      return {
        label: 'To do',
        className: 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200',
      };
    case 'in_progress':
      return {
        label: 'In progress',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
      };
    case 'done':
      return {
        label: 'Done',
        className:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
      };
  }
}

export function KanbanTaskCard({
  task,
  isOverlay,
  onOpenDetails,
  onEdit,
  onOpenComments,
  onDelete,
}: {
  task: KanbanTask;
  isOverlay?: boolean;
  onOpenDetails?: (taskId: string) => void;
  onEdit?: (task: KanbanTask) => void;
  onOpenComments?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
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
        'rounded-2xl border border-black/10 bg-white p-3 shadow-sm',
        'dark:border-white/10 dark:bg-zinc-900/40',
        'select-none',
        !isOverlay && onOpenDetails
          ? 'cursor-pointer hover:bg-black/2 dark:hover:bg-white/3'
          : '',
        isOverlay ? 'shadow-lg' : '',
        isDragging ? 'opacity-50' : '',
      ].join(' ')}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isOverlay) return;
        if (!onOpenDetails) return;
        e.stopPropagation();
        onOpenDetails(task.id);
      }}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='truncate text-sm font-semibold'>{task.title}</div>
          {task.description ? (
            <div className='mt-1 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300'>
              {task.description}
            </div>
          ) : null}
          {task.assignee ? (
            <div className='mt-2 truncate text-xs text-zinc-600 dark:text-zinc-300'>
              Assigned:{' '}
              <span className='font-medium text-zinc-800 dark:text-zinc-100'>
                {task.assignee.name}
              </span>{' '}
              <span className='text-zinc-500 dark:text-zinc-400'>
                ({task.assignee.email})
              </span>
            </div>
          ) : null}
          {task.dueAt ? (
            <div className='mt-1 truncate text-xs text-zinc-600 dark:text-zinc-300'>
              Due:{' '}
              <span className='font-medium text-zinc-800 dark:text-zinc-100'>
                {formatDue(task.dueAt)}
              </span>
            </div>
          ) : null}
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <span
            className={`rounded-full px-2 py-1 text-[11px] font-medium ${pill.className}`}
          >
            {pill.label}
          </span>
        </div>
      </div>

      {!isOverlay && (onEdit || onDelete || onOpenComments) ? (
        <div className='mt-3 border-t border-black/10 pt-2 dark:border-white/10'>
          <div className='flex items-center justify-end gap-2'>
            {onOpenComments ? (
              <button
                type='button'
                className='h-8 rounded-xl border border-black/10 bg-white px-3 text-[11px] font-medium text-zinc-700 shadow-sm hover:bg-black/4 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/6'
                title='View comments'
                aria-label='View comments'
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenComments(task.id);
                }}
              >
                Comments
              </button>
            ) : null}

            {/* Add spacer here */}
            <div className='flex-1' />

            {onEdit ? (
              <button
                type='button'
                className='h-8 rounded-xl border border-black/10 bg-white px-3 text-[11px] font-medium text-zinc-700 shadow-sm hover:bg-black/4 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/6'
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
                type='button'
                className='h-8 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-[11px] font-medium text-red-700 shadow-sm hover:bg-red-500/15 dark:text-red-300'
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
        </div>
      ) : null}
    </article>
  );
}
