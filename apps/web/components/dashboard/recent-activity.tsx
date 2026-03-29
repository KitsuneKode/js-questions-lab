'use client';

import {
  IconArrowRight as ArrowRight,
  IconCircleCheck as CheckCircle2,
  IconClock as Clock,
  IconCircleX as XCircle,
} from '@tabler/icons-react';
import Link from 'next/link';
import type { QuestionRecord } from '@/lib/content/types';
import { useProgress } from '@/lib/progress/progress-context';
import type { AttemptRecord } from '@/lib/progress/storage';

interface RecentActivityProps {
  questions: QuestionRecord[];
}

interface RecentAttempt {
  questionId: number;
  title: string;
  slug: string;
  attempt: AttemptRecord;
}

export function RecentActivity({ questions }: RecentActivityProps) {
  const { state } = useProgress();

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const recentAttempts: RecentAttempt[] = [];
  for (const item of Object.values(state.questions)) {
    const q = questionMap.get(item.questionId);
    if (!q) continue;
    for (const attempt of item.attempts) {
      recentAttempts.push({
        questionId: item.questionId,
        title: q.title,
        slug: q.slug,
        attempt,
      });
    }
  }

  recentAttempts.sort(
    (a, b) => new Date(b.attempt.attemptedAt).getTime() - new Date(a.attempt.attemptedAt).getTime(),
  );

  const last10 = recentAttempts.slice(0, 8);

  if (last10.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6 h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-500">
        <Clock className="w-32 h-32 text-primary" />
      </div>

      <div className="mb-6 relative z-10">
        <h3 className="font-display text-xl text-foreground">Recent Activity</h3>
        <p className="text-xs text-secondary mt-1">Your latest practice attempts.</p>
      </div>

      <ul className="space-y-3 relative z-10 flex-1">
        {last10.map((entry) => {
          const isCorrect = entry.attempt.status === 'correct';
          const time = new Date(entry.attempt.attemptedAt);
          const relTime = formatRelativeTime(time);

          return (
            <li key={`${entry.questionId}-${entry.attempt.attemptedAt}-${entry.attempt.status}`}>
              <Link
                href={`/questions/${entry.questionId}`}
                className="group/item flex items-center justify-between rounded-xl border border-border-subtle bg-background p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-glow"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`flex shrink-0 h-8 w-8 items-center justify-center rounded-full ${isCorrect ? 'bg-status-correct/10 text-status-correct' : 'bg-status-wrong/10 text-status-wrong'}`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover/item:text-primary transition-colors">
                      {entry.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-tertiary font-mono bg-surface border border-border-subtle px-1 rounded">
                        #{entry.questionId}
                      </span>
                      <span className="text-[10px] text-tertiary">{relTime}</span>
                    </div>
                  </div>
                </div>
                <div className="h-8 w-8 shrink-0 rounded-full border border-border-subtle bg-surface flex items-center justify-center group-hover/item:border-primary/30 group-hover/item:bg-primary/10 transition-colors ml-4">
                  <ArrowRight className="h-3.5 w-3.5 text-tertiary group-hover/item:text-primary transition-transform group-hover/item:translate-x-0.5" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}
