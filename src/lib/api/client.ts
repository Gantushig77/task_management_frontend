import { getApiBaseUrl } from "@/lib/env";
import type { ApiError } from "@/lib/api/types";

export type AuthHeaderProvider = () => string | null;

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export type ApiClientOptions = {
  baseUrl?: string;
  getAuthHeader?: AuthHeaderProvider;
};

async function parseJsonSafely(res: Response): Promise<unknown | null> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export class ApiClient {
  private baseUrl: string;
  private getAuthHeader?: AuthHeaderProvider;

  constructor(opts: ApiClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? getApiBaseUrl()).replace(/\/+$/, "");
    this.getAuthHeader = opts.getAuthHeader;
  }

  async request<T>(
    path: string,
    init: RequestInit & { json?: unknown } = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");

    const authHeader = this.getAuthHeader?.();
    if (authHeader) headers.set("authorization", authHeader);

    let body: BodyInit | undefined = init.body as BodyInit | undefined;
    if (init.json !== undefined) {
      headers.set("content-type", "application/json");
      body = JSON.stringify(init.json);
    }

    const res = await fetch(url, {
      ...init,
      headers,
      body,
    });

    if (!res.ok) {
      const payload = await parseJsonSafely(res);
      const apiErr: ApiError = {
        status: res.status,
        message:
          (payload as { message?: string } | null)?.message ??
          res.statusText ??
          "Request failed",
        details: payload ?? undefined,
      };
      throw new HttpError(apiErr.message, apiErr.status, apiErr.details);
    }

    const payload = await parseJsonSafely(res);
    return payload as T;
  }
}

