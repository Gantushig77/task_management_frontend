import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    session: null,
    isHydrated: true,
  }),
}));

describe('Home page', () => {
  it('renders the redirecting message', () => {
    render(<Home />);
    expect(screen.getByText('Redirecting…')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });
});

