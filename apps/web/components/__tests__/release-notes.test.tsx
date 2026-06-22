import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReleaseNotesPage } from '@/components/releases/release-notes-page';
import type { Release } from '@/lib/releases/types';

vi.mock('@/components/releases/version-nav', () => ({
  VersionNav: () => <div data-testid="version-nav" />,
}));

const SAMPLE_RELEASES: Release[] = [
  {
    version: '0.2.0',
    date: '2026-06-23',
    releaseUrl: 'https://github.com/example/releases/tag/v0.2.0',
    changes: [
      { type: 'added', text: 'Release notes page' },
      { type: 'fixed', text: 'Branch sync automation' },
    ],
  },
];

const COPY = {
  eyebrow: 'Changelog',
  title: 'Release Notes',
  intro: 'Intro',
  englishNote: 'English only',
  emptyTitle: 'Empty',
  emptyBody: 'No releases',
  navigateLabel: 'Navigate',
  currentVersionLabel: 'Versions',
  githubRelease: 'GitHub Release',
  compareChanges: 'Compare',
  sectionLabels: { added: 'Added', fixed: 'Fixed' },
};

describe('ReleaseNotesPage', () => {
  it('renders releases with version heading', () => {
    render(<ReleaseNotesPage releases={SAMPLE_RELEASES} appVersion="0.2.0" copy={COPY} />);
    expect(screen.getByRole('heading', { name: 'v0.2.0' })).toBeInTheDocument();
    expect(screen.getByText('Release notes page')).toBeInTheDocument();
    expect(screen.getByTestId('version-nav')).toBeInTheDocument();
  });

  it('renders empty state when no releases', () => {
    render(<ReleaseNotesPage releases={[]} appVersion="0.1.0" copy={COPY} />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.queryByTestId('version-nav')).not.toBeInTheDocument();
  });
});
