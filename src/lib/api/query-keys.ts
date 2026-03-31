export const queryKeys = {
  workspaces: () => ["workspaces"] as const,
  workspace: (id: string) => ["workspaces", id] as const,
  workspaceMembers: (workspaceId: string) => ["workspaces", workspaceId, "members"] as const,
  boards: (workspaceId: string) => ["workspaces", workspaceId, "boards"] as const,
  board: (id: string) => ["boards", id] as const,
  tasks: (boardId: string) => ["boards", boardId, "tasks"] as const,
  task: (id: string) => ["tasks", id] as const,
  comments: (taskId: string) => ["tasks", taskId, "comments"] as const,
} as const;

