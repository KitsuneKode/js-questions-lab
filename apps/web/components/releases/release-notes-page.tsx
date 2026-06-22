import { Container } from '@/components/container';
import { ReleaseEntry } from '@/components/releases/release-entry';
import { VersionNav } from '@/components/releases/version-nav';
import type { Release, ReleaseChangeType } from '@/lib/releases/types';

interface ReleaseNotesPageProps {
  releases: Release[];
  appVersion: string;
  copy: {
    eyebrow: string;
    title: string;
    intro: string;
    englishNote: string;
    emptyTitle: string;
    emptyBody: string;
    navigateLabel: string;
    currentVersionLabel: string;
    githubRelease: string;
    compareChanges: string;
    sectionLabels: Partial<Record<ReleaseChangeType, string>>;
  };
}

function groupChangesByType(release: Release): Partial<Record<ReleaseChangeType, string[]>> {
  const grouped: Partial<Record<ReleaseChangeType, string[]>> = {};
  for (const change of release.changes) {
    const list = grouped[change.type] ?? [];
    list.push(change.text);
    grouped[change.type] = list;
  }
  return grouped;
}

export function ReleaseNotesPage({ releases, appVersion, copy }: ReleaseNotesPageProps) {
  const displayVersion = appVersion.startsWith('v') ? appVersion : `v${appVersion}`;

  return (
    <main className="bg-void min-h-screen pt-32 pb-16 md:pt-40 md:pb-24">
      <Container>
        <header className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {copy.eyebrow}
          </p>
          <h1 className="font-serif text-4xl tracking-tight text-foreground md:text-5xl">
            {copy.title}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">{copy.intro}</p>
          <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {displayVersion}
          </p>
          <p className="text-xs text-tertiary">{copy.englishNote}</p>
        </header>

        {releases.length === 0 ? (
          <div className="mt-12 rounded-xl border border-border/60 bg-surface/50 p-8">
            <h2 className="font-serif text-xl text-foreground">{copy.emptyTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy.emptyBody}</p>
          </div>
        ) : (
          <>
            <div className="mt-10">
              <VersionNav
                releases={releases}
                navigateLabel={copy.navigateLabel}
                currentVersionLabel={copy.currentVersionLabel}
              />
            </div>
            <div className="space-y-2">
              {releases.map((release, index) => (
                <ReleaseEntry
                  key={release.version}
                  version={release.version}
                  date={release.date}
                  isLatest={index === 0}
                  compareUrl={release.compareUrl}
                  releaseUrl={release.releaseUrl}
                  changesByType={groupChangesByType(release)}
                  labels={{
                    githubRelease: copy.githubRelease,
                    compareChanges: copy.compareChanges,
                  }}
                  sectionLabels={copy.sectionLabels}
                />
              ))}
            </div>
          </>
        )}
      </Container>
    </main>
  );
}
