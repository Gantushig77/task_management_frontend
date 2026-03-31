import type { TaskStatus } from "@/lib/api/types";

export type KanbanColumn = {
  id: TaskStatus;
  title: string;
};

export type KanbanTask = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueAt?: string | null;
  assignee?: {
    name: string;
    email: string;
  } | null;
};

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To do" },
  { id: "in_progress", title: "In progress" },
  { id: "done", title: "Done" },
];

export const MOCK_TASKS: KanbanTask[] = [
  {
    id: "t-1",
    title: "Design board layout",
    description: "Columns, cards, spacing, and states",
    status: "todo",
  },
  {
    id: "t-2",
    title: "Implement drag & drop",
    description: "Move tasks across columns + reorder",
    status: "todo",
  },
  {
    id: "t-3",
    title: "Auth guard for /app",
    description: "Redirect unauthenticated users to /login",
    status: "in_progress",
  },
  {
    id: "t-4",
    title: "Create API client layer",
    description: "Typed endpoints and error handling",
    status: "done",
  },
];

