'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createAuthedApi, useAuth } from '@/lib/auth/auth-context';
import { queryKeys } from '@/lib/api/query-keys';
import type { Board, Comment, Task, Workspace, WorkspaceMember } from '@/lib/api/types';
import { useToast } from '@/ui/toast/toast-provider';

export const DEFAULT_PAGE_LIMIT = 10;

function useIsAuthedReady(): boolean {
  const { session, isHydrated } = useAuth();
  return isHydrated && !!session?.tokens?.accessToken;
}

export function useApi() {
  const { session, logout, isHydrated } = useAuth();
  const toast = useToast();

  const hasToken = !!session?.tokens?.accessToken;
  return createAuthedApi(session, {
    // Only auto-logout if we *actually had a token* (i.e. this was an authenticated call).
    onUnauthorized:
      isHydrated && hasToken
        ? () => {
            logout();
            toast.show('Your session expired. Please sign in again.');
          }
        : undefined,
    onTooManyRequests: () => {
      toast.show('Too many requests. Please try again shortly.');
    },
  });
}

export function useWorkspaces() {
  const api = useApi();
  const enabled = useIsAuthedReady();
  return useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: async () =>
      (await api.workspace.list({ limit: DEFAULT_PAGE_LIMIT, offset: 0 })).items,
    enabled,
  });
}

export function useInfiniteWorkspaces(limit = DEFAULT_PAGE_LIMIT) {
  const api = useApi();
  const enabled = useIsAuthedReady();
  return useInfiniteQuery({
    queryKey: [...queryKeys.workspaces(), 'infinite', limit] as const,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return api.workspace.list({ limit, offset });
    },
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage: {
      offset: number;
      items: { id: string; name: string }[];
      total: number;
    }) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      if (nextOffset >= lastPage.total) return undefined;
      return nextOffset;
    },
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

export function useWorkspace(id: string) {
  const api = useApi();
  const enabled = useIsAuthedReady() && !!id;
  return useQuery({
    queryKey: queryKeys.workspace(id),
    queryFn: () => api.workspace.get(id),
    enabled,
  });
}

export function useUpdateWorkspace() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation<Workspace, unknown, { id: string; name: string }>({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.workspace.update(id, { name }),
    onSuccess: (_ws: Workspace, vars: { id: string; name: string }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workspace(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.workspaces() });
    },
  });
}

export function useDeleteWorkspace() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation<void, unknown, { id: string }>({
    mutationFn: ({ id }: { id: string }) => api.workspace.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces() });
    },
  });
}

export function useBoards(workspaceId: string) {
  const api = useApi();
  const enabled = useIsAuthedReady() && !!workspaceId;
  return useQuery({
    queryKey: queryKeys.boards(workspaceId),
    queryFn: async () =>
      (await api.board.list({ workspaceId, limit: DEFAULT_PAGE_LIMIT, offset: 0 })).items,
    enabled,
  });
}

export function useInfiniteBoards(workspaceId: string, limit = DEFAULT_PAGE_LIMIT) {
  const api = useApi();
  const enabled = useIsAuthedReady() && !!workspaceId;
  return useInfiniteQuery({
    queryKey: [...queryKeys.boards(workspaceId), 'infinite', limit] as const,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return api.board.list({ workspaceId, limit, offset });
    },
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage: {
      offset: number;
      items: { id: string; name: string; workspaceId: string }[];
      total: number;
    }) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      if (nextOffset >= lastPage.total) return undefined;
      return nextOffset;
    },
  });
}

export function useInfiniteWorkspaceMembers(workspaceId: string, limit = DEFAULT_PAGE_LIMIT) {
  const api = useApi();
  const enabled = useIsAuthedReady() && !!workspaceId;
  return useInfiniteQuery({
    queryKey: [...queryKeys.workspaceMembers(workspaceId), 'infinite', limit] as const,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return api.workspace.members(workspaceId, { limit, offset });
    },
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage: {
      offset: number;
      items: { workspaceId: string }[];
      total: number;
    }) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      if (nextOffset >= lastPage.total) return undefined;
      return nextOffset;
    },
  });
}

export function useInviteWorkspaceMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation<
    WorkspaceMember,
    unknown,
    { workspaceId: string; email: string; role?: 'member' | 'owner' }
  >({
    mutationFn: ({
      workspaceId,
      email,
      role,
    }: {
      workspaceId: string;
      email: string;
      role?: 'member' | 'owner';
    }) => api.workspace.invite(workspaceId, { email, role }),
    onSuccess: (_res: WorkspaceMember, vars: { workspaceId: string }) => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaceMembers(vars.workspaceId) });
    },
  });
}

export function useCreateBoard() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation<Board, unknown, { workspaceId: string; name: string }>({
    mutationFn: (input: { workspaceId: string; name: string }) => api.board.create(input),
    onSuccess: (_board: Board, vars: { workspaceId: string; name: string }) => {
      qc.invalidateQueries({ queryKey: queryKeys.boards(vars.workspaceId) });
    },
  });
}

export function useUpdateBoard() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation<Board, unknown, { id: string; workspaceId: string; name: string }>({
    mutationFn: ({ id, name }: { id: string; workspaceId: string; name: string }) =>
      api.board.update(id, { name }),
    onSuccess: (_board: Board, vars: { id: string; workspaceId: string; name: string }) => {
      qc.invalidateQueries({ queryKey: queryKeys.boards(vars.workspaceId) });
      qc.invalidateQueries({ queryKey: queryKeys.board(vars.id) });
    },
  });
}

export function useDeleteBoard() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation<void, unknown, { id: string; workspaceId: string }>({
    mutationFn: ({ id }: { id: string; workspaceId: string }) => api.board.remove(id),
    onSuccess: (_void: void, vars: { id: string; workspaceId: string }) => {
      qc.invalidateQueries({ queryKey: queryKeys.boards(vars.workspaceId) });
    },
  });
}

export function useBoard(id: string) {
  const api = useApi();
  const enabled = useIsAuthedReady() && !!id;
  return useQuery({
    queryKey: queryKeys.board(id),
    queryFn: () => api.board.get(id),
    enabled,
  });
}

export function useTasks(boardId: string) {
  const api = useApi();
  const enabled = useIsAuthedReady() && !!boardId;
  return useQuery({
    queryKey: queryKeys.tasks(boardId),
    queryFn: async () => {
      const list = await api.task.list({ boardId, limit: DEFAULT_PAGE_LIMIT, offset: 0 });
      const detailed = await Promise.all(
        list.items.map(async (t) => {
          const d = await api.task.get(t.id);
          return { ...d, assignee: t.assignee ?? d.assignee ?? null };
        }),
      );
      return detailed;
    },
    enabled,
  });
}

export function useInfiniteTasks(boardId: string, limit = DEFAULT_PAGE_LIMIT) {
  const api = useApi();
  const enabled = useIsAuthedReady() && !!boardId;
  return useInfiniteQuery({
    queryKey: [...queryKeys.tasks(boardId), 'infinite', limit] as const,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      const list = await api.task.list({ boardId, limit, offset });
      const detailed = await Promise.all(
        list.items.map(async (t) => {
          const d = await api.task.get(t.id);
          return { ...d, assignee: t.assignee ?? d.assignee ?? null };
        }),
      );
      return { ...list, items: detailed };
    },
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage: { offset: number; items: { id: string }[]; total: number }) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      if (nextOffset >= lastPage.total) return undefined;
      return nextOffset;
    },
  });
}

export function useUpdateTask() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation<
    Task,
    unknown,
    {
      id: string;
      input: {
        title: string;
        description?: string;
        status?: string;
        assignedToUserId?: string | null;
        dueAt?: string | null;
      };
    }
  >({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: {
        title: string;
        description?: string;
        status?: string;
        assignedToUserId?: string | null;
        dueAt?: string | null;
      };
    }) => api.task.update(id, input),
    onSuccess: (_task: Task, vars: { id: string }) => {
      qc.invalidateQueries({ queryKey: queryKeys.task(vars.id) });
      // Broad invalidation; later we can optimistically update per-board lists.
      qc.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useWorkspaceMembers(workspaceId: string, limit = 200) {
  const api = useApi();
  const enabled = useIsAuthedReady() && !!workspaceId;
  return useQuery({
    queryKey: [...queryKeys.workspaceMembers(workspaceId), 'list', limit] as const,
    queryFn: async () => (await api.workspace.members(workspaceId, { limit, offset: 0 })).items,
    enabled,
  });
}

export function useComments(taskId: string) {
  const api = useApi();
  const enabled = useIsAuthedReady() && !!taskId;
  return useQuery({
    queryKey: queryKeys.comments(taskId),
    queryFn: async () => (await api.comment.listByTask(taskId, { limit: 200, offset: 0 })).items,
    enabled,
  });
}

export function useCreateComment(taskId: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string }) => api.comment.createForTask(taskId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comments(taskId) });
    },
  });
}

export function useDeleteComment(taskId: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => api.comment.removeForTask(taskId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comments(taskId) });
    },
  });
}

// Convenience re-exports for typing/usage sites if needed
export type { Workspace, Board, Task, Comment };
