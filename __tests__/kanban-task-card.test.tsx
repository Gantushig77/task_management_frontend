import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanTaskCard } from '@/ui/kanban/kanban-task-card';

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

describe('KanbanTaskCard', () => {
  it('renders task title and calls onOpenDetails when clicked', () => {
    const onOpenDetails = vi.fn();

    render(
      <KanbanTaskCard
        task={{
          id: 't1',
          title: 'My Task',
          description: 'Short description',
          status: 'todo',
          assignee: null,
          dueAt: null,
        }}
        onOpenDetails={onOpenDetails}
      />,
    );

    expect(screen.getByText('My Task')).toBeInTheDocument();
    screen.getByText('My Task').closest('article')?.click();
    expect(onOpenDetails).toHaveBeenCalledWith('t1');
  });
});

