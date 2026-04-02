'use client';

import { IconTarget as Target } from '@tabler/icons-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { TagStats } from '@/lib/progress/analytics';
import { cn } from '@/lib/utils';

interface WeakestTopicsProps {
  topics: TagStats[];
}

export function WeakestTopics({ topics }: WeakestTopicsProps) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6 h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-500">
        <Target className="w-32 h-32 text-rose-500" />
      </div>

      <div className="mb-6 relative z-10 flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-foreground">Needs Practice</h3>
          <p className="text-xs text-secondary mt-1">
            Focus on these concepts to improve your mastery.
          </p>
        </div>
      </div>

      <ul className="space-y-3 relative z-10 flex-1">
        {topics.map((topic) => {
          const accuracy = Math.round(topic.accuracy * 100);
          return (
            <li key={topic.tag}>
              <Link
                href={`/questions?tag=${encodeURIComponent(topic.tag)}`}
                className="group/item flex items-center justify-between rounded-xl border border-border-subtle bg-background p-3 transition-all duration-300 hover:border-danger/40 hover:bg-danger/5 hover:shadow-[0_4px_20px_rgba(244,63,94,0.1)]"
              >
                <div className="flex flex-col px-1">
                  <span className="text-sm font-medium text-foreground capitalize group-hover/item:text-danger transition-colors">
                    {topic.tag}
                  </span>
                  <span className="text-[10px] text-tertiary mt-0.5">
                    {topic.questionCount} questions
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right flex flex-col items-end">
                    <span
                      className={cn(
                        'block text-xs font-mono font-bold',
                        accuracy < 50 ? 'text-status-wrong' : 'text-[#F59E0B]',
                      )}
                    >
                      {accuracy}%
                    </span>
                    <span className="block text-[8px] uppercase tracking-widest text-tertiary mt-0.5">
                      Accuracy
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg bg-surface border border-border-subtle text-xs px-3 font-medium text-secondary group-hover/item:bg-danger group-hover/item:text-white group-hover/item:border-danger transition-all shadow-sm"
                  >
                    Practice
                  </Button>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
