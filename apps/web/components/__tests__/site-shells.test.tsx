import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/site-header', () => ({
  SiteHeader: () => <header data-testid="site-header" />,
}));

vi.mock('@/components/site-footer', () => ({
  SiteFooter: () => <footer data-testid="site-footer" />,
}));

vi.mock('@/components/scratchpad/floating-scratchpad-gate', () => ({
  FloatingScratchpadGate: () => null,
}));

vi.mock('@/components/notification-manager', () => ({
  NotificationManager: () => <div data-testid="notification-manager" />,
}));

vi.mock('@/lib/progress/progress-context', () => ({
  ProgressProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
  Toaster: () => null,
}));

import { AppSiteShell, LiteSiteShell } from '@/app/provider';

describe('site shells', () => {
  it('LiteSiteShell renders chrome without NotificationManager', () => {
    render(
      <LiteSiteShell>
        <div data-testid="page-content">home</div>
      </LiteSiteShell>,
    );

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-manager')).not.toBeInTheDocument();
  });

  it('AppSiteShell renders NotificationManager for practice routes', () => {
    render(
      <AppSiteShell>
        <div data-testid="page-content">questions</div>
      </AppSiteShell>,
    );

    expect(screen.getByTestId('notification-manager')).toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });
});
