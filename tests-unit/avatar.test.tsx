import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Avatar } from '../src/components/ui';
import type { User } from '../src/types';

afterEach(cleanup);

const mk = (avatar: string | null): User => ({
  id: '1', name: 'Ada Lovelace', email: 'a@b.c', tagline: '', avatar,
  emailVerified: true, requiresEmailVerification: false, createdAt: 0,
});
const REMOTE = 'https://pbs.twimg.com/profile_images/1/a_400x400.jpg';

describe('Avatar fallback sequence', () => {
  it('tries the photo directly first', () => {
    render(<Avatar user={mk(REMOTE)} />);
    expect(screen.getByRole('img').getAttribute('src')).toBe(REMOTE);
  });

  it('direct fail -> proxy -> initials (old code stopped at a broken image)', () => {
    render(<Avatar user={mk(REMOTE)} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img').getAttribute('src')).toContain('wsrv.nl');
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('never sends data: photos (uploads, Microsoft) to the proxy', () => {
    render(<Avatar user={mk('data:image/jpeg;base64,AAAA')} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('resets when the photo changes, so one bad photo does not poison the next', () => {
    const { rerender } = render(<Avatar user={mk(REMOTE)} />);
    fireEvent.error(screen.getByRole('img'));
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).toBeNull();
    const NEXT = 'https://example.com/new.jpg';
    rerender(<Avatar user={mk(NEXT)} />);
    expect(screen.getByRole('img').getAttribute('src')).toBe(NEXT);
  });

  it('shows initials when there is no photo', () => {
    render(<Avatar user={mk(null)} />);
    expect(screen.getByText('AL')).toBeTruthy();
  });
});
