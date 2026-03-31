"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAuthedApi, useAuth } from "@/lib/auth/auth-context";
import { queryKeys } from "@/lib/api/query-keys";
import type { Board, Comment, Task, Workspace } from "@/lib/api/types";

export function useApi() {
  const { session } = useAuth();
  return createAuthedApi(session);
}

export function useWorkspaces() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: () => api.workspace.list(),
  });
}

export function useCreateWorkspace() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) => api.workspace.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.workspaces() }),
  });
}

export function useBoards(workspaceId: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.boards(workspaceId),
    queryFn: () => api.board.list(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useTasks(boardId: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.tasks(boardId),
    queryFn: () => api.task.list(boardId),
    enabled: !!boardId,
  });
}

export function useUpdateTask() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) =>
      api.task.update(id, patch),
    onSuccess: (_task, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.task(vars.id) });
      // Broad invalidation; later we can optimistically update per-board lists.
      qc.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useComments(taskId: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.comments(taskId),
    queryFn: () => api.comment.list(taskId),
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string }) => api.comment.create(taskId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.comments(taskId) }),
  });
}

// Convenience re-exports for typing/usage sites if needed
export type { Workspace, Board, Task, Comment };

