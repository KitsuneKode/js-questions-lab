'use client';

import {
  IconArticle,
  IconBook,
  IconBrandGithub,
  IconBrandYoutube,
  IconChevronDown,
  IconExternalLink,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { QuestionResource } from '@/lib/content/types';
import { cn } from '@/lib/utils';

const RESOURCE_ICONS = {
  video: IconBrandYoutube,
  blog: IconArticle,
  docs: IconBook,
  repo: IconBrandGithub,
} as const;

const RESOURCE_ICON_CLASSES = {
  video: 'text-red-500',
  blog: 'text-amber-400',
  docs: 'text-sky-400',
  repo: 'text-foreground/70',
} as const;

interface ResourcesPanelProps {
  resources: QuestionResource[];
}

export function ResourcesPanel({ resources }: ResourcesPanelProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('ide');

  if (resources.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/40 bg-surface/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{t('resourcesHeader')}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-tertiary">{resources.length}</span>
          <IconChevronDown
            className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-border/30 divide-y divide-border/20">
          {resources.map((resource) => {
            const Icon = RESOURCE_ICONS[resource.type];
            return (
              <a
                key={`${resource.type}-${resource.url}`}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface/60 transition-colors group"
              >
                <Icon className={cn('h-4 w-4 shrink-0', RESOURCE_ICON_CLASSES[resource.type])} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground/90 group-hover:text-foreground truncate block">
                    {resource.title}
                  </span>
                  {resource.author && (
                    <span className="text-[11px] text-tertiary">{resource.author}</span>
                  )}
                </div>
                <IconExternalLink className="h-3.5 w-3.5 shrink-0 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
