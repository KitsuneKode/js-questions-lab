import fs from 'node:fs';
import path from 'node:path';

import type { Release, ReleaseChangeType } from '@/lib/releases/types';

const SECTION_MAP: Record<string, ReleaseChangeType> = {
  added: 'added',
  fixed: 'fixed',
  changed: 'changed',
  performance: 'performance',
  security: 'security',
  documentation: 'documentation',
  miscellaneous: 'miscellaneous',
  // release-please / keep-a-changelog aliases
  features: 'added',
  'bug fixes': 'fixed',
  'breaking changes': 'changed',
};

const REPO_ROOTS = [
  path.resolve(/* turbopackIgnore: true */ process.cwd()),
  path.resolve(/* turbopackIgnore: true */ process.cwd(), '..', '..'),
];

function resolveRepoFile(relativePath: string): string | null {
  for (const root of REPO_ROOTS) {
    const candidate = path.join(root, relativePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function normalizeSection(heading: string): ReleaseChangeType | null {
  const key = heading.trim().toLowerCase();
  return SECTION_MAP[key] ?? null;
}

function parseBullet(line: string): string | null {
  const match = line.match(/^\s*[-*]\s+(.+)$/);
  return match?.[1]?.trim() ?? null;
}

/** Parse keep-a-changelog / release-please CHANGELOG.md into structured releases. */
export function parseChangelog(markdown: string, repoUrl?: string): Release[] {
  const releases: Release[] = [];
  const lines = markdown.split('\n');

  let current: Release | null = null;
  let currentSection: ReleaseChangeType | null = null;

  const flush = () => {
    if (current && current.changes.length > 0) {
      releases.push(current);
    }
    current = null;
    currentSection = null;
  };

  for (const line of lines) {
    const versionMatch = line.match(/^##\s+\[([^\]]+)\](?:\s+-\s+(\S+))?/);
    if (versionMatch) {
      flush();
      const version = versionMatch[1] ?? '';
      if (version.toLowerCase() === 'unreleased') continue;

      const date = versionMatch[2] ?? '';
      const tag = version.startsWith('v') ? version : `v${version}`;
      current = {
        version,
        date,
        changes: [],
        ...(repoUrl
          ? {
              releaseUrl: `${repoUrl}/releases/tag/${tag}`,
            }
          : {}),
      };
      continue;
    }

    const sectionMatch = line.match(/^###\s+(.+)$/);
    if (sectionMatch && current) {
      currentSection = normalizeSection(sectionMatch[1] ?? '');
      continue;
    }

    if (current && currentSection) {
      const bullet = parseBullet(line);
      if (bullet) {
        current.changes.push({ type: currentSection, text: bullet });
      }
    }
  }

  flush();

  // Attach compare URLs (each release compared to the next older version)
  if (repoUrl) {
    for (let i = 0; i < releases.length; i++) {
      const newer = releases[i];
      const older = releases[i + 1];
      if (!newer) continue;
      const newerTag = newer.version.startsWith('v') ? newer.version : `v${newer.version}`;
      if (older) {
        const olderTag = older.version.startsWith('v') ? older.version : `v${older.version}`;
        newer.compareUrl = `${repoUrl}/compare/${olderTag}...${newerTag}`;
      }
    }
  }

  return releases;
}

export function readChangelogFile(repoUrl?: string): Release[] {
  const changelogPath = resolveRepoFile('CHANGELOG.md');
  if (!changelogPath) return [];
  const markdown = fs.readFileSync(changelogPath, 'utf8');
  return parseChangelog(markdown, repoUrl);
}

export function readAppVersion(): string {
  const manifestPath = resolveRepoFile('.release-please-manifest.json');
  if (manifestPath) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, string>;
      if (manifest['.']) return manifest['.'];
    } catch {
      // fall through
    }
  }

  const packagePath = resolveRepoFile('package.json');
  if (packagePath) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { version?: string };
      if (pkg.version) return pkg.version;
    } catch {
      // fall through
    }
  }

  return '0.0.0';
}

/** Exported for tests — build ReleaseChange list from raw section + bullets */
export function mapSectionToType(heading: string): ReleaseChangeType | null {
  return normalizeSection(heading);
}
