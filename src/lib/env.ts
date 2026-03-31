export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  // Default to same-origin proxy to avoid CORS in local dev.
  if (!base) return "/api";
  return base.replace(/\/+$/, "");
}

