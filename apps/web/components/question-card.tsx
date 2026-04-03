'use client';

import {
  IconArrowRight as ArrowRight,
  IconBookmark as Bookmark,
  IconTerminal2 as Terminal,
} from '@tabler/icons-react';
import { IntentPrefetchLink } from '@/components/intent-prefetch-link';
import { Badge } from '@/components/ui/badge';
import type { QuestionDiscoveryItem, QuestionRecord, QuestionSummary } from '@/lib/content/types';
import { useQuestionProgress } from '@/lib/progress/use-question-progress';
import { cn } from '@/lib/utils';

type QuestionCardQuestion = QuestionRecord | QuestionSummary | QuestionDiscoveryItem;

interface QuestionCardProps {
  question: QuestionCardQuestion;
  locale: string;
  isHovered?: boolean;
  href?: string;
}

const difficultyStyles = {
  easy: 'border-status-correct text-status-correct',
  medium: 'border-[#F59E0B] text-[#F59E0B]',
  hard: 'border-status-wrong text-status-wrong',
} as const;

export function QuestionCard({ question, locale, isHovered, href }: QuestionCardProps) {
  const { ready, item } = useQuestionProgress(question.id);

  const hasAttempts = item.attempts.length > 0;
  const isCorrect = item.attempts.some((a) => a.status === 'correct');
  const isBookmarked = item.bookmarked;

  const difficulty = (question.difficulty?.toLowerCase() ||
    'medium') as keyof typeof difficultyStyles;

  const previewCode =
    'previewCode' in question
      ? question.previewCode
      : 'codeBlocks' in question
        ? (question.codeBlocks[0]?.code ?? '')
        : '';
  const codeLines = previewCode.split('\n').slice(0, 3);
  const showEllipsis = previewCode.split('\n').length > 3;

  return (
    <IntentPrefetchLink
      href={href ?? `/${locale}/questions/${question.id}`}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-surface p-5 transition-all duration-500',
        isHovered
          ? 'border-border-focus shadow-glow bg-elevated/80'
          : 'border-border-subtle hover:border-border-focus hover:bg-elevated/50 hover:shadow-lg hover:-translate-y-1',
      )}
    >
      {/* Top Row: Number, Difficulty, and Status */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="font-mono text-xs font-semibold text-secondary"
            style={{ viewTransitionName: `question-num-${question.id}` }}
          >
            #{question.id}
          </span>
          <span
            className={cn(
              'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-background/50',
              difficultyStyles[difficulty],
            )}
          >
            {question.difficulty}
          </span>
        </div>

        {/* Status Indicators */}
        {ready && (
          <div className="flex items-center gap-2">
            {isBookmarked && <Bookmark className="h-3.5 w-3.5 fill-primary text-primary" />}
            {hasAttempts && (
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  isCorrect
                    ? 'bg-status-correct shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                    : 'bg-status-wrong shadow-[0_0_8px_rgba(239,68,68,0.6)]',
                )}
              />
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-4 font-display text-xl font-medium leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
        <span style={{ viewTransitionName: `question-title-${question.id}` }}>
          {question.title}
        </span>
      </h3>

      {/* Mini Code Preview */}
      {previewCode && (
        <div className="mb-5 min-w-0 w-full rounded-lg border border-border-subtle bg-code p-3 transition-colors group-hover:border-primary/20 group-hover:bg-code/80">
          <pre className="min-w-0 w-full overflow-hidden font-mono text-[11px] leading-relaxed text-secondary/80">
            <code className="block min-w-0 w-full">
              {codeLines.map((line, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static preview lines, order never changes
                <div key={i} className="whitespace-pre truncate">
                  {line || ' '}
                </div>
              ))}
              {showEllipsis && <div className="text-tertiary">...</div>}
            </code>
          </pre>
        </div>
      )}

      <div className="flex-1" />

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-2">
        <div className="flex flex-wrap gap-1.5">
          {question.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-elevated border-border-subtle px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-secondary transition-colors group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20"
            >
              {tag}
            </Badge>
          ))}
          {question.tags.length > 2 && (
            <span className="px-1 text-[9px] text-tertiary flex items-center">
              +{question.tags.length - 2}
            </span>
          )}
        </div>

        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary opacity-0 transition-all group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
          {question.runnable && <Terminal className="h-3 w-3" />}
          Practice
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </IntentPrefetchLink>
  );
}
