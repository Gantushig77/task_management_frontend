'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DEFAULT_PAGE_LIMIT, useInfiniteWorkspaces } from '@/lib/api/hooks';
import { useIntersection } from '@/ui/use-intersection';
import { CreateWorkspaceButton } from '@/ui/workspaces/create-workspace-button';

export default function AppHome() {
  const { session } = useAuth();
  const workspacesQuery = useInfiniteWorkspaces(DEFAULT_PAGE_LIMIT);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const { ref: sentinelRef, isIntersecting } = useIntersection<HTMLDivElement>({
    // Smaller margin so we don't prefetch too aggressively.
    rootMargin: '0px 0px 80px 0px',
  });

  const workspaces = useMemo(
    () =>
      workspacesQuery.data?.pages.flatMap(
        (p: { items: { id: string; name: string }[] }) => p.items,
      ) ?? [],
    [workspacesQuery.data],
  );

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 0) setHasUserScrolled(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isIntersecting) return;
    // Prevent auto-fetching additional pages immediately on mount
    // before the user scrolls near the end.
    if (!hasUserScrolled) return;
    if (!workspacesQuery.hasNextPage) return;
    if (workspacesQuery.isFetchingNextPage) return;
    workspacesQuery.fetchNextPage();
  }, [isIntersecting, hasUserScrolled, workspacesQuery]);

  return (
    <div className='flex flex-1 flex-col bg-zinc-50 px-6 py-10 dark:bg-black'>
      <div className='mx-auto w-full max-w-4xl'>
        <h1 className='text-2xl font-semibold tracking-tight'>Your workspaces</h1>
        <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
          Browse your workspaces (infinite scroll). Open the demo board anytime to see the
          Kanban UI.
        </p>

        <div className='mt-6 grid gap-4 sm:grid-cols-2'>
          <div className='rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950'>
            <div className='text-sm font-medium'>Signed in</div>
            <div className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
              {session
                ? (session.user?.username ??
                  session.user?.name ??
                  session.user?.email ??
                  'User')
                : 'No session'}
            </div>
          </div>

          <Link
            className='rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:bg-black/2 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/4'
            href='/app/demo-board'
          >
            <div className='text-sm font-medium'>Open demo Kanban board</div>
            <div className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
              Drag tasks between columns.
            </div>
          </Link>
        </div>

        <div className='mt-6 rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950'>
          <div className='mb-3 flex items-center justify-between'>
            <div className='text-sm font-semibold'>Workspaces</div>
            <div className='flex items-center gap-3'>
              <div className='text-xs text-zinc-600 dark:text-zinc-400'>
                {workspacesQuery.isLoading ? 'Loading…' : `${workspaces.length} loaded`}
              </div>
              <CreateWorkspaceButton
                label='+ Workspace'
                className='h-9 rounded-xl bg-black px-3 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200'
              />
            </div>
          </div>

          {workspacesQuery.isError ? (
            <div className='rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300'>
              Failed to load workspaces.
            </div>
          ) : null}

          <div className='flex flex-col gap-2'>
            {workspaces.map((ws: { id: string; name: string }) => (
              <Link
                key={ws.id}
                href={`/app/workspaces/${ws.id}`}
                className='rounded-xl border border-black/10 bg-white px-3 py-3 text-sm hover:bg-black/2 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/4'
              >
                <div className='font-medium'>{ws.name}</div>
                <div className='mt-0.5 text-xs text-zinc-600 dark:text-zinc-400'>
                  {ws.id}
                </div>
              </Link>
            ))}

            <div ref={sentinelRef} className='h-1' />

            {workspacesQuery.isFetchingNextPage ? (
              <div className='px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400'>
                Loading more…
              </div>
            ) : null}

            {!workspacesQuery.isLoading && workspaces.length === 0 ? (
              <div className='rounded-xl border border-dashed border-black/15 px-3 py-8 text-center text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-400'>
                No workspaces yet.
              </div>
            ) : null}

            {!workspacesQuery.hasNextPage && workspaces.length > 0 ? (
              <div className='px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400'>
                End of list.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
