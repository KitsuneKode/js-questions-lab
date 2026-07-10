import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const setDisplayName = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/engagement/actions', () => ({
  setDisplayName: (...args: unknown[]) => setDisplayName(...args),
}));

import { DisplayNameForm } from '@/components/dashboard/display-name-form';

describe('DisplayNameForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDisplayName.mockResolvedValue({ ok: true, displayName: 'kitsune' });
  });

  it('submits the entered display name', async () => {
    render(<DisplayNameForm initialName={null} />);

    fireEvent.change(screen.getByLabelText('displayNameLabel'), {
      target: { value: 'kitsune' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'displayNameSave' }));

    await waitFor(() => {
      expect(setDisplayName).toHaveBeenCalledWith('kitsune');
    });

    expect(await screen.findByText('displayNameSaved')).toBeInTheDocument();
  });

  it('shows validation errors returned by the server action', async () => {
    setDisplayName.mockResolvedValue({ ok: false, error: 'Name must be 2–24 characters' });

    render(<DisplayNameForm initialName={null} />);

    fireEvent.change(screen.getByLabelText('displayNameLabel'), {
      target: { value: 'a' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'displayNameSave' }));

    expect(await screen.findByText('Name must be 2–24 characters')).toBeInTheDocument();
  });
});
