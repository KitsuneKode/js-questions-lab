import { describe, expect, it } from 'vitest';

import { mapSectionToType, parseChangelog } from '@/lib/releases/parse-changelog';

const FIXTURE = `# Changelog

## [Unreleased]

## [0.2.0] - 2026-06-23

### Added

- New release notes page

### Fixed

- Branch sync automation ([#34](https://github.com/example/pull/34))

## [0.1.0] - 2026-04-01

### Added

- Initial public release
`;

describe('parseChangelog', () => {
  it('parses version headers and categorized bullets', () => {
    const releases = parseChangelog(FIXTURE, 'https://github.com/KitsuneKode/js-questions-lab');

    expect(releases).toHaveLength(2);
    expect(releases[0]?.version).toBe('0.2.0');
    expect(releases[0]?.date).toBe('2026-06-23');
    expect(releases[0]?.changes).toHaveLength(2);
    expect(releases[0]?.changes[0]).toEqual({
      type: 'added',
      text: 'New release notes page',
    });
    expect(releases[0]?.changes[1]?.type).toBe('fixed');
    expect(releases[0]?.releaseUrl).toBe(
      'https://github.com/KitsuneKode/js-questions-lab/releases/tag/v0.2.0',
    );
    expect(releases[0]?.compareUrl).toBe(
      'https://github.com/KitsuneKode/js-questions-lab/compare/v0.1.0...v0.2.0',
    );
  });

  it('skips Unreleased section', () => {
    const releases = parseChangelog('## [Unreleased]\n\n### Added\n\n- WIP', undefined);
    expect(releases).toHaveLength(0);
  });

  it('maps section aliases', () => {
    expect(mapSectionToType('Features')).toBe('added');
    expect(mapSectionToType('Bug Fixes')).toBe('fixed');
    expect(mapSectionToType('Performance')).toBe('performance');
  });
});
