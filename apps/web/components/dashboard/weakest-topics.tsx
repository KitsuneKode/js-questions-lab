'use client';

import {
  IconArrowRight as ArrowRight,
  IconTarget as Target,
} from '@tabler/icons-react';
import Link from 'next/link';
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

      <div className="mb-6 relative z-10">
        <h3 className="font-display text-xl text-foreground">Needs Practice</h3>
        <p className="text-xs text-secondary mt-1">
          Focus on these concepts to improve your mastery.
        </p>
      </div>

      <ul className="space-y-3 relative z-10 flex-1">
        {topics.map((topic) => {
          const accuracy = Math.round(topic.accuracy * 100);
          return (
            <li key={topic.tag}>
              <Link
                href={`/questions?tag=${encodeURIComponent(topic.tag)}`}
                className="group/item flex items-center justify-between rounded-xl border border-border-subtle bg-background p-3.5 transition-all duration-300 hover:border-[#F59E0B]/40 hover:bg-[#F59E0B]/5 hover:shadow-[0_4px_20px_rgba(245,158,11,0.05)]"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground capitalize group-hover/item:text-primary transition-colors">
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
                  <div className="h-8 w-8 rounded-full border border-border-subtle bg-surface flex items-center justify-center group-hover/item:border-primary/30 group-hover/item:bg-primary/10 transition-colors">
                    <ArrowRight className="h-3.5 w-3.5 text-tertiary group-hover/item:text-primary transition-transform group-hover/item:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
