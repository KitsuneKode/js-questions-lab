import { cache } from 'react';

import { readAppVersion, readChangelogFile } from '@/lib/releases/parse-changelog';
import type { Release } from '@/lib/releases/types';
import { siteConfig } from '@/lib/site-config';

export const getReleases = cache((): Release[] => {
  return readChangelogFile(siteConfig.repoUrl);
});

export const getLatestRelease = cache((): Release | null => {
  const releases = getReleases();
  return releases[0] ?? null;
});

export const getAppVersion = cache((): string => {
  const latest = getLatestRelease();
  if (latest?.version) return latest.version;
  return readAppVersion();
});
