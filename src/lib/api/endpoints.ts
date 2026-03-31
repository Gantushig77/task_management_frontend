import { ApiClient } from "@/lib/api/client";
import type { AuthSession, Board, Comment, Task, Workspace } from "@/lib/api/types";

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
        client.request<AuthResponse>("/auth/register", { method: "POST", json: body }).then((r) => ({
          tokens: { accessToken: r.access_token, expiresAt: r.expires_at },
        })),
      login: (body: LoginRequest) =>
        client.request<AuthResponse>("/auth/login", { method: "POST", json: body }).then((r) => ({
          tokens: { accessToken: r.access_token, expiresAt: r.expires_at },
        })),
      resetPasswordRequest: (body: ResetPasswordRequest) =>
        client.request<{ message?: string }>("/auth/reset-password/request", {
          method: "POST",
          json: body,
        }),
      resetPasswordConfirm: (body: ResetPasswordConfirmRequest) =>
        client.request<{ message?: string }>("/auth/reset-password/confirm", {
          method: "POST",
          json: body,
        }),
    },
    users: {
      me: () =>
        client.request<{
          id: string;
          email: string;
          name: string;
          role: "user" | "admin" | string;
          email_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }>("/me"),
    },
    workspace: {
      list: () => client.request<Workspace[]>("/workspaces"),
      get: (id: string) => client.request<Workspace>(`/workspaces/${id}`),
      create: (body: { name: string }) =>
        client.request<Workspace>("/workspaces", { method: "POST", json: body }),
      update: (id: string, body: { name?: string }) =>
        client.request<Workspace>(`/workspaces/${id}`, { method: "PATCH", json: body }),
      remove: (id: string) =>
        client.request<{ ok: true }>(`/workspaces/${id}`, { method: "DELETE" }),
    },
    board: {
      list: (workspaceId: string) =>
        client.request<Board[]>(`/workspaces/${workspaceId}/boards`),
      get: (id: string) => client.request<Board>(`/boards/${id}`),
      create: (workspaceId: string, body: { name: string }) =>
        client.request<Board>(`/workspaces/${workspaceId}/boards`, {
          method: "POST",
          json: body,
        }),
      update: (id: string, body: { name?: string }) =>
        client.request<Board>(`/boards/${id}`, { method: "PATCH", json: body }),
      remove: (id: string) =>
        client.request<{ ok: true }>(`/boards/${id}`, { method: "DELETE" }),
    },
    task: {
      list: (boardId: string) => client.request<Task[]>(`/boards/${boardId}/tasks`),
      get: (id: string) => client.request<Task>(`/tasks/${id}`),
      create: (boardId: string, body: Pick<Task, "title" | "description" | "status">) =>
        client.request<Task>(`/boards/${boardId}/tasks`, {
          method: "POST",
          json: body,
        }),
      update: (
        id: string,
        body: Partial<Pick<Task, "title" | "description" | "status" | "position">>,
      ) => client.request<Task>(`/tasks/${id}`, { method: "PATCH", json: body }),
      remove: (id: string) =>
        client.request<{ ok: true }>(`/tasks/${id}`, { method: "DELETE" }),
      move: (id: string, body: { status: Task["status"]; position: number }) =>
        client.request<Task>(`/tasks/${id}/move`, { method: "POST", json: body }),
    },
    comment: {
      list: (taskId: string) => client.request<Comment[]>(`/tasks/${taskId}/comments`),
      create: (taskId: string, body: { body: string }) =>
        client.request<Comment>(`/tasks/${taskId}/comments`, {
          method: "POST",
          json: body,
        }),
      update: (id: string, body: { body: string }) =>
        client.request<Comment>(`/comments/${id}`, { method: "PATCH", json: body }),
      remove: (id: string) =>
        client.request<{ ok: true }>(`/comments/${id}`, { method: "DELETE" }),
    },
  };
}

