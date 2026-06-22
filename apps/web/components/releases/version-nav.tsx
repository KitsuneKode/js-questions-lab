'use client';

import { useEffect, useState } from 'react';

import type { Release } from '@/lib/releases/types';
import { cn } from '@/lib/utils';

interface VersionNavProps {
  releases: Release[];
  navigateLabel: string;
  currentVersionLabel: string;
}

export function VersionNav({ releases, navigateLabel, currentVersionLabel }: VersionNavProps) {
  const [activeVersion, setActiveVersion] = useState(releases[0]?.version ?? '');

  useEffect(() => {
    if (releases.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('release-', '').replace(/-/g, '.');
            setActiveVersion(id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );

    for (const release of releases) {
      const el = document.getElementById(`release-${release.version.replace(/\./g, '-')}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [releases]);

  if (releases.length === 0) return null;

  return (
    <nav
      aria-label={currentVersionLabel}
      className="sticky top-24 z-10 mb-10 rounded-xl border border-border/60 bg-surface/80 p-4 backdrop-blur-md"
    >
      <label
        htmlFor="version-nav"
        className="text-xs font-medium uppercase tracking-wider text-tertiary"
      >
        {navigateLabel}
      </label>
      <select
        id="version-nav"
        value={activeVersion}
        onChange={(e) => {
          const version = e.target.value;
          setActiveVersion(version);
          const el = document.getElementById(`release-${version.replace(/\./g, '-')}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        className={cn(
          'mt-2 w-full rounded-lg border border-border bg-void px-3 py-2',
          'text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
      >
        {releases.map((release) => {
          const label = release.version.startsWith('v') ? release.version : `v${release.version}`;
          return (
            <option key={release.version} value={release.version}>
              {label}
            </option>
          );
        })}
      </select>
    </nav>
  );
}
