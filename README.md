# Task Management Frontend

Next.js (App Router) frontend for the Task Management service. It talks to the backend Task Management API and provides a workspace → board → Kanban task workflow.

## Features

- **Authentication**
  - Register (`/register`)
  - Login (`/login`)
  - Reset password request + confirm (`/reset-password`)
  - Current user (`/me`) hydration after login
  - Optional **mock auth** for local development (demo/admin credentials)
- **Workspaces**
  - List (infinite scroll)
  - Create, rename, delete
  - Members list + “load more”
  - Invite members (API exists; UI includes members dialog)
- **Boards**
  - List per workspace
  - Create, rename, delete
- **Tasks (Kanban)**
  - Board task list (paginated / “load more”)
  - Create, edit, delete
  - Drag & drop between columns (status updates)
  - Task details dialog
  - Optional assignee + due date
- **Comments**
  - View and manage task comments via dialog
- **Developer ergonomics**
  - Built-in `/api` proxy (Next.js rewrites) to avoid CORS in local dev
  - React Query data fetching/caching (`@tanstack/react-query`)

## Project structure

The app is organized by **routing** in `src/app/`, **UI components** in `src/ui/`, and **domain/client logic** in `src/lib/`.

```text
.
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                # Root providers (React Query, Toasts, Auth)
│  │  ├─ page.tsx                  # Landing page (marketing / entry)
│  │  ├─ login/page.tsx            # Login screen
│  │  ├─ register/page.tsx         # Register screen
│  │  ├─ reset-password/page.tsx   # Reset password flow
│  │  └─ app/
│  │     ├─ layout.tsx             # Authenticated shell (sidebar, sign out)
│  │     ├─ page.tsx               # Workspaces home (infinite scroll)
│  │     ├─ demo-board/page.tsx    # Demo Kanban UI
│  │     ├─ workspaces/[id]/page.tsx # Workspace details + boards + members
│  │     └─ boards/[id]/page.tsx   # Board Kanban view
│  ├─ lib/
│  │  ├─ env.ts                    # API base URL resolution
│  │  ├─ api/
│  │  │  ├─ client.ts              # Fetch wrapper + HttpError
│  │  │  ├─ endpoints.ts           # Typed API surface (auth/workspaces/boards/tasks/comments)
│  │  │  ├─ hooks.ts               # React Query hooks (infinite lists, mutations)
│  │  │  ├─ query-keys.ts          # React Query key helpers
│  │  │  └─ types.ts               # Shared API types
│  │  ├─ auth/
│  │  │  ├─ auth-context.tsx       # Session state + API auth header wiring
│  │  │  ├─ route-guards.tsx       # Route protection helpers
│  │  │  ├─ storage.ts             # localStorage persistence
│  │  │  ├─ roles.ts               # role helpers (e.g. admin)
│  │  │  └─ mock-auth.ts           # optional mock login/register for local dev
│  │  ├─ kanban/mock-data.ts       # Kanban columns + demo data
│  │  └─ query/query-provider.tsx  # React Query provider
│  └─ ui/
│     ├─ kanban/                   # Kanban column + task card components
│     ├─ tasks/                    # Task dialogs
│     ├─ comments/                 # Comments dialog
│     ├─ boards/                   # Board creation UI
│     ├─ workspaces/               # Workspace + members dialogs
│     └─ toast/                    # Toast provider
├─ docs/
│  └─ backend/swagger.yaml|json    # Backend API spec reference
├─ next.config.ts                  # `/api` rewrite proxy to backend
├─ Dockerfile                       # Production container (standalone output)
└─ .env.example                     # Environment variable template
```

## Prerequisites

- **Node.js 20+**
- **pnpm** (recommended; this repo has a `pnpm-lock.yaml`)
- A running **backend API** (defaults to `http://localhost:8080`)

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

- **`NEXT_PUBLIC_API_BASE_URL`**: Base URL used by the browser for API calls.
  - Recommended for local dev: **`/api`** (same-origin proxy; avoids CORS)
  - If you point directly to backend (requires CORS on backend): `http://localhost:8080`
- **`BACKEND_URL`**: Backend base URL used by Next.js rewrites (server-side only).
  - Used only when `NEXT_PUBLIC_API_BASE_URL=/api` (or unset), because Next will proxy `/api/*` → `${BACKEND_URL}/api/*`
- **`NEXT_PUBLIC_MOCK_AUTH`**: Enables mock login/register fallback when backend is unreachable.
  - `true`/`1` to enable, `false`/`0` to disable

### Mock auth credentials (local dev)

When mock auth is enabled, you can sign in with:

- **Demo user**: `demo` / `demo123`
- **Admin user**: `admin` / `admin123`

## Run locally (recommended)

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

### How API calls work locally (no CORS)

By default the frontend calls **`/api/...`** (same origin). `next.config.ts` rewrites that to your backend:

- Browser → `http://localhost:3000/api/...`
- Next.js rewrite → `http://localhost:8080/api/...` (or whatever `BACKEND_URL` is)

## Build and run (production, non-Docker)

```bash
pnpm build
pnpm start
```

## Run with Docker (production)

Build the image:

```bash
docker build -t task-management-frontend .
```

Run it (set `BACKEND_URL` to wherever the backend is reachable from the container):

```bash
docker run --rm -p 3000:3000 \
  -e BACKEND_URL="http://host.docker.internal:8080" \
  -e NEXT_PUBLIC_API_BASE_URL="/api" \
  -e NEXT_PUBLIC_MOCK_AUTH="false" \
  task-management-frontend
```

Then open `http://localhost:3000`.

## Backend API reference

The backend OpenAPI/Swagger spec is included in:

- `docs/backend/swagger.yaml`
- `docs/backend/swagger.json`
