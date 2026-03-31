export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

export type AuthUser = {
  id?: string | null;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  role?: "user" | "admin";
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthTokens = {
  accessToken: string;
  expiresAt?: string;
  refreshToken?: string;
};

export type AuthSession = {
  user?: AuthUser;
  tokens: AuthTokens;
};

export type Workspace = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Board = {
  id: string;
  workspaceId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  boardId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  position: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Comment = {
  id: string;
  taskId: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
};

