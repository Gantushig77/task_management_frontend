export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

function getBackendUrl(): string {
  return (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/+$/, "");
}

async function proxy(req: Request, ctx: RouteContext): Promise<Response> {
  const { path = [] } = await ctx.params;

  const backendUrl = getBackendUrl();
  const upstream = new URL(`${backendUrl}/api/${path.map(encodeURIComponent).join("/")}`);

  const incomingUrl = new URL(req.url);
  upstream.search = incomingUrl.search;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const method = req.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const res = await fetch(upstream.toString(), {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const resHeaders = new Headers(res.headers);
  // Avoid forwarding a content-encoding header when Next has to re-stream the body.
  resHeaders.delete("content-encoding");

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
  });
}

export function GET(req: Request, ctx: RouteContext) {
  return proxy(req, ctx);
}
export function POST(req: Request, ctx: RouteContext) {
  return proxy(req, ctx);
}
export function PUT(req: Request, ctx: RouteContext) {
  return proxy(req, ctx);
}
export function PATCH(req: Request, ctx: RouteContext) {
  return proxy(req, ctx);
}
export function DELETE(req: Request, ctx: RouteContext) {
  return proxy(req, ctx);
}
export function OPTIONS(req: Request, ctx: RouteContext) {
  return proxy(req, ctx);
}
