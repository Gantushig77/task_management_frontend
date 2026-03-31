import { ApiClient } from '@/lib/api/client';
import type { Comment, Task, Workspace, WorkspaceMember } from '@/lib/api/types';

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  expires_at: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ResetPasswordRequest = {
  email: string;
};

export type ResetPasswordConfirmRequest = {
  token: string;
  new_password: string;
};

export function createApi(client: ApiClient) {
  return {
    auth: {
      register: (body: RegisterRequest) =>
        client
          .request<AuthResponse>('/auth/register', { method: 'POST', json: body })
          .then((r) => ({
            tokens: { accessToken: r.access_token, expiresAt: r.expires_at },
          })),
      login: (body: LoginRequest) =>
        client
          .request<AuthResponse>('/auth/login', { method: 'POST', json: body })
          .then((r) => ({
            tokens: { accessToken: r.access_token, expiresAt: r.expires_at },
          })),
      resetPasswordRequest: (body: ResetPasswordRequest) =>
        client.request<{ message?: string }>('/auth/reset-password/request', {
          method: 'POST',
          json: body,
        }),
      resetPasswordConfirm: (body: ResetPasswordConfirmRequest) =>
        client.request<{ message?: string }>('/auth/reset-password/confirm', {
          method: 'POST',
          json: body,
        }),
    },
    users: {
      me: () =>
        client.request<{
          id: string;
          email: string;
          name: string;
          role: 'user' | 'admin' | string;
          email_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }>('/me'),
    },
    workspace: {
      list: (params?: { limit?: number; offset?: number }) => {
        const sp = new URLSearchParams();
        if (params?.limit !== undefined) sp.set('limit', String(params.limit));
        if (params?.offset !== undefined) sp.set('offset', String(params.offset));
        const qs = sp.toString();
        return client.request<{
          items: Workspace[];
          total: number;
          limit: number;
          offset: number;
        }>(`/workspaces${qs ? `?${qs}` : ''}`);
      },
      get: (id: string) => client.request<Workspace>(`/workspaces/${id}`),
      create: (body: { name: string }) =>
        client.request<Workspace>('/workspaces', { method: 'POST', json: body }),
      update: (id: string, body: { name: string }) =>
        client.request<Workspace>(`/workspaces/${id}`, { method: 'PUT', json: body }),
      remove: (id: string) =>
        client.request<void>(`/workspaces/${id}`, { method: 'DELETE' }),
      members: (id: string, params?: { limit?: number; offset?: number }) => {
        const sp = new URLSearchParams();
        if (params?.limit !== undefined) sp.set('limit', String(params.limit));
        if (params?.offset !== undefined) sp.set('offset', String(params.offset));
        const qs = sp.toString();
        return client
          .request<{
            items: Array<{
              role: string;
              workspace_id: string;
              user: {
                id: string;
                email: string;
                name: string;
                role: string;
                email_verified_at?: string | null;
              };
            }>;
            total: number;
            limit: number;
            offset: number;
          }>(`/workspaces/${id}/members${qs ? `?${qs}` : ''}`)
          .then((r) => ({
            ...r,
            items: r.items.map(
              (m): WorkspaceMember => ({
                workspaceId: m.workspace_id,
                role: m.role,
                user: {
                  id: m.user.id,
                  email: m.user.email,
                  name: m.user.name,
                  role: m.user.role,
                  emailVerifiedAt: m.user.email_verified_at ?? null,
                },
              }),
            ),
          }));
      },
      invite: (id: string, body: { email: string; role?: "member" | "owner" }) =>
        client
          .request<{
            role: string;
            workspace_id: string;
            user: {
              id: string;
              email: string;
              name: string;
              role: string;
              email_verified_at?: string | null;
            };
          }>(`/workspaces/${id}/invite`, {
            method: "POST",
            json: { email: body.email, role: body.role },
          })
          .then(
            (m): WorkspaceMember => ({
              workspaceId: m.workspace_id,
              role: m.role,
              user: {
                id: m.user.id,
                email: m.user.email,
                name: m.user.name,
                role: m.user.role,
                emailVerifiedAt: m.user.email_verified_at ?? null,
              },
            }),
          ),
    },
    board: {
      list: (params?: { workspaceId?: string; limit?: number; offset?: number }) => {
        const sp = new URLSearchParams();
        if (params?.workspaceId) sp.set('workspace_id', params.workspaceId);
        if (params?.limit !== undefined) sp.set('limit', String(params.limit));
        if (params?.offset !== undefined) sp.set('offset', String(params.offset));
        const qs = sp.toString();
        return client.request<{
          items: Array<{ id: string; name: string; position: number; workspace_id: string }>;
          total: number;
          limit: number;
          offset: number;
        }>(`/boards${qs ? `?${qs}` : ''}`).then((r) => ({
          ...r,
          items: r.items.map((b) => ({
            id: b.id,
            name: b.name,
            position: b.position,
            workspaceId: b.workspace_id,
          })),
        }));
      },
      get: (id: string) =>
        client
          .request<{ id: string; name: string; position: number; workspace_id: string }>(
            `/boards/${id}`,
          )
          .then((b) => ({
            id: b.id,
            name: b.name,
            position: b.position,
            workspaceId: b.workspace_id,
          })),
      create: (body: { workspaceId: string; name: string; position?: number }) =>
        client
          .request<{ id: string; name: string; position: number; workspace_id: string }>(
            '/boards',
            {
              method: 'POST',
              json: {
                workspace_id: body.workspaceId,
                name: body.name,
                position: body.position,
              },
            },
          )
          .then((b) => ({
            id: b.id,
            name: b.name,
            position: b.position,
            workspaceId: b.workspace_id,
          })),
      update: (id: string, body: { name: string; position?: number }) =>
        client
          .request<{ id: string; name: string; position: number; workspace_id: string }>(
            `/boards/${id}`,
            { method: 'PUT', json: { name: body.name, position: body.position } },
          )
          .then((b) => ({
            id: b.id,
            name: b.name,
            position: b.position,
            workspaceId: b.workspace_id,
          })),
      remove: (id: string) =>
        client.request<void>(`/boards/${id}`, { method: 'DELETE' }),
    },
    task: {
      list: (params?: { boardId?: string; limit?: number; offset?: number }) => {
        const sp = new URLSearchParams();
        if (params?.boardId) sp.set('board_id', params.boardId);
        if (params?.limit !== undefined) sp.set('limit', String(params.limit));
        if (params?.offset !== undefined) sp.set('offset', String(params.offset));
        const qs = sp.toString();
        return client.request<{
          items: Array<{
            id: string;
            board_id: string;
            title: string;
            assignee?: { id: string; email: string; name: string } | null;
          }>;
          total: number;
          limit: number;
          offset: number;
        }>(`/tasks${qs ? `?${qs}` : ''}`);
      },
      get: (id: string) =>
        client
          .request<{
            id: string;
            board_id: string;
            title: string;
            description?: string | null;
            status?: string | null;
            assigned_to_user_id?: string | null;
            assignee?: { id: string; email: string; name: string } | null;
            due_at?: string | null;
            created_at?: string;
            updated_at?: string;
          }>(`/tasks/${id}`)
          .then((t) => ({
            id: t.id,
            boardId: t.board_id,
            title: t.title,
            description: t.description ?? null,
            status: (t.status ?? 'todo') as Task['status'],
            // Backend doesn't expose ordering yet; keep 0.
            position: 0,
            dueAt: t.due_at ?? null,
            assignedToUserId: t.assigned_to_user_id ?? null,
            assignee: t.assignee ?? null,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
          })),
      create: (body: {
        boardId: string;
        title: string;
        description?: string;
        status?: string;
        assignedToUserId?: string | null;
        dueAt?: string | null;
      }) =>
        client
          .request<{ id: string }>(`/tasks`, {
            method: 'POST',
            json: {
              board_id: body.boardId,
              title: body.title,
              description: body.description,
              status: body.status,
              assigned_to_user_id: body.assignedToUserId,
              due_at: body.dueAt,
            },
          })
          .then((r) => createApi(client).task.get(r.id)),
      update: (
        id: string,
        body: {
          title: string;
          description?: string;
          status?: string;
          assignedToUserId?: string | null;
          dueAt?: string | null;
        },
      ) =>
        client
          .request<void>(`/tasks/${id}`, {
            method: 'PUT',
            json: {
              title: body.title,
              description: body.description,
              status: body.status,
              assigned_to_user_id: body.assignedToUserId,
              due_at: body.dueAt,
            },
          })
          .then(() => createApi(client).task.get(id)),
      remove: (id: string) => client.request<void>(`/tasks/${id}`, { method: 'DELETE' }),
    },
    comment: {
      listByTask: (taskId: string, params?: { limit?: number; offset?: number }) => {
        const sp = new URLSearchParams();
        if (params?.limit !== undefined) sp.set('limit', String(params.limit));
        if (params?.offset !== undefined) sp.set('offset', String(params.offset));
        const qs = sp.toString();
        return client
          .request<{
            items: Array<{
              id: string;
              task_id: string;
              body: string;
              created_by_user_id?: string | null;
              author?: { id: string; name: string; email: string } | null;
            }>;
            total: number;
            limit: number;
            offset: number;
          }>(`/tasks/${taskId}/comments${qs ? `?${qs}` : ''}`)
          .then((r) => ({
            ...r,
            items: r.items.map(
              (c): Comment => ({
                id: c.id,
                taskId: c.task_id,
                body: c.body,
                createdByUserId: c.created_by_user_id ?? null,
                author: c.author ?? null,
              }),
            ),
          }));
      },
      createForTask: (taskId: string, body: { body: string }) =>
        client
          .request<{
            id: string;
            task_id: string;
            body: string;
            created_by_user_id?: string | null;
            author?: { id: string; name: string; email: string } | null;
          }>(`/tasks/${taskId}/comments`, { method: 'POST', json: body })
          .then(
            (c): Comment => ({
              id: c.id,
              taskId: c.task_id,
              body: c.body,
              createdByUserId: c.created_by_user_id ?? null,
              author: c.author ?? null,
            }),
          ),
      updateForTask: (taskId: string, commentId: string, body: { body: string }) =>
        client
          .request<{ id: string; task_id: string; body: string }>(
            `/tasks/${taskId}/comments/${commentId}`,
            { method: 'PUT', json: body },
          )
          .then(
            (c): Comment => ({
              id: c.id,
              taskId: c.task_id,
              body: c.body,
            }),
          ),
      removeForTask: (taskId: string, commentId: string) =>
        client.request<void>(`/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }),
    },
  };
}
