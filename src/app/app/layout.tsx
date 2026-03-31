'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { isAdmin } from '@/lib/auth/roles';
import { RequireAuth } from '@/lib/auth/route-guards';
import { DEFAULT_PAGE_LIMIT, useInfiniteWorkspaces } from '@/lib/api/hooks';
import { CreateWorkspaceButton } from '@/ui/workspaces/create-workspace-button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const displayName =
    session?.user?.username ?? session?.user?.name ?? session?.user?.email ?? 'User';
  const workspacesQuery = useInfiniteWorkspaces(DEFAULT_PAGE_LIMIT);
  const workspaces =
    workspacesQuery.data?.pages.flatMap(
      (p: { items: { id: string; name: string }[] }) => p.items,
    ) ?? [];

  return (
    <RequireAuth>
      <div className='flex flex-1 min-h-0'>
        <aside className='hidden w-64 shrink-0 border-r border-black/10 bg-white px-4 py-4 dark:border-white/10 dark:bg-zinc-950 md:flex md:flex-col'>
          <div className='mb-6'>
            <Link className='text-sm font-semibold tracking-tight' href='/app'>
              Task Management
            </Link>
            <div className='mt-1 text-xs text-zinc-600 dark:text-zinc-400'>
              {session
                ? `Signed in as ${displayName}${isAdmin(session) ? " (admin)" : ""}`
                : 'Not signed in'}
            </div>
          </div>

          <nav className='flex flex-col gap-2 text-sm'>
            <Link
              className='rounded-lg px-3 py-2 hover:bg-black/4 dark:hover:bg-white/6'
              href='/app'
            >
              Home
            </Link>
            <Link
              className='rounded-lg px-3 py-2 hover:bg-black/4 dark:hover:bg-white/6'
              href='/app/demo-board'
            >
              Demo board
            </Link>
          </nav>

          <div className='mt-5'>
            <div className='flex items-center justify-between px-3'>
              <div className='text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
                Workspaces
              </div>
              <CreateWorkspaceButton
                label='+'
                className='h-7 w-7 rounded-lg border border-black/10 bg-white text-xs font-semibold hover:bg-black/4 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6'
              />
            </div>
            <div className='tm-scrollbar mt-2 max-h-[45vh] overflow-auto rounded-xl border border-black/10 dark:border-white/10'>
              <div className='flex flex-col p-2'>
                {workspaces.map((ws: { id: string; name: string }) => (
                  <Link
                    key={ws.id}
                    href={`/app/workspaces/${ws.id}`}
                    className='rounded-lg px-2 py-2 text-sm hover:bg-black/4 dark:hover:bg-white/6'
                  >
                    {ws.name}
                  </Link>
                ))}
                {!workspacesQuery.isLoading && workspaces.length === 0 ? (
                  <div className='px-2 py-2 text-xs text-zinc-600 dark:text-zinc-400'>
                    No workspaces yet.
                  </div>
                ) : null}
                {workspacesQuery.isLoading ? (
                  <div className='px-2 py-2 text-xs text-zinc-600 dark:text-zinc-400'>
                    Loading…
                  </div>
                ) : null}
                {workspacesQuery.hasNextPage ? (
                  <button
                    type='button'
                    className='mt-1 rounded-lg px-2 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-black/4 dark:text-zinc-300 dark:hover:bg-white/6'
                    onClick={() => workspacesQuery.fetchNextPage()}
                    disabled={workspacesQuery.isFetchingNextPage}
                  >
                    {workspacesQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className='mt-auto pt-4'>
            <button
              className='h-10 w-full rounded-xl border border-black/10 bg-white text-sm font-medium hover:bg-black/4 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/6'
              onClick={() => {
                logout();
                router.push('/login');
              }}
              type='button'
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className='flex min-w-0 flex-1 flex-col'>{children}</main>
      </div>
    </RequireAuth>
  );
}
