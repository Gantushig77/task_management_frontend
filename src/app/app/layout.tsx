'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { isAdmin } from '@/lib/auth/roles';
import { RequireAuth } from '@/lib/auth/route-guards';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const displayName =
    session?.user?.username ?? session?.user?.name ?? session?.user?.email ?? 'User';

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
