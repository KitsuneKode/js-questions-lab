import { IconArrowUpRight } from '@tabler/icons-react';
import Link from 'next/link';

import type { ReleaseChangeType } from '@/lib/releases/types';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<ReleaseChangeType, string> = {
  added: 'Added',
  fixed: 'Fixed',
  changed: 'Changed',
  performance: 'Performance',
  security: 'Security',
  documentation: 'Documentation',
  miscellaneous: 'Miscellaneous',
};

const TYPE_STYLES: Record<ReleaseChangeType, string> = {
  added: 'text-emerald-400',
  fixed: 'text-sky-400',
  changed: 'text-amber-400',
  performance: 'text-violet-400',
  security: 'text-red-400',
  documentation: 'text-muted-foreground',
  miscellaneous: 'text-muted-foreground',
};

interface ReleaseSectionProps {
  type: ReleaseChangeType;
  items: string[];
  typeLabel?: string;
}

export function ReleaseSection({ type, items, typeLabel }: ReleaseSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className={cn('text-xs font-semibold uppercase tracking-wider', TYPE_STYLES[type])}>
        {typeLabel ?? TYPE_LABELS[type]}
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="text-sm leading-relaxed text-muted-foreground pl-3 border-l border-border/60"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ReleaseEntryProps {
  version: string;
  date: string;
  isLatest?: boolean;
  compareUrl?: string;
  releaseUrl?: string;
  changesByType: Partial<Record<ReleaseChangeType, string[]>>;
  labels: {
    githubRelease: string;
    compareChanges: string;
  };
  sectionLabels: Partial<Record<ReleaseChangeType, string>>;
}

export function ReleaseEntry({
  version,
  date,
  isLatest,
  compareUrl,
  releaseUrl,
  changesByType,
  labels,
  sectionLabels,
}: ReleaseEntryProps) {
  const displayVersion = version.startsWith('v') ? version : `v${version}`;
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <article
      id={`release-${version.replace(/\./g, '-')}`}
      className="scroll-mt-28 border-t border-border/50 pt-10 first:border-t-0 first:pt-0"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="space-y-1">
          <h2
            className={cn(
              'font-serif text-3xl tracking-tight',
              isLatest ? 'text-primary' : 'text-foreground',
            )}
          >
            {displayVersion}
          </h2>
          {formattedDate ? <p className="text-sm text-tertiary">{formattedDate}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {releaseUrl ? (
            <Link
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-tertiary transition-colors hover:text-primary"
            >
              {labels.githubRelease}
              <IconArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          {compareUrl ? (
            <Link
              href={compareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-tertiary transition-colors hover:text-primary"
            >
              {labels.compareChanges}
              <IconArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </header>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {(Object.keys(changesByType) as ReleaseChangeType[]).map((type) => {
          const items = changesByType[type];
          if (!items?.length) return null;
          return (
            <ReleaseSection key={type} type={type} items={items} typeLabel={sectionLabels[type]} />
          );
        })}
      </div>
    </article>
  );
}
