'use client';

import { IconSearch as Search } from '@tabler/icons-react';
import { useState, useMemo, useEffect } from 'react';
import { QuestionCard } from '@/components/question-card';
import type { QuestionRecord } from '@/lib/content/types';
import { useProgress } from '@/lib/progress/progress-context';

interface QuestionsResultsProps {
  questions: QuestionRecord[];
  status: 'all' | 'answered' | 'unanswered' | 'bookmarked';
  locale: string;
}

export function QuestionsResults({ questions, status, locale }: QuestionsResultsProps) {
  const { state: progress } = useProgress();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayQuestions, setDisplayQuestions] = useState<QuestionRecord[]>(questions);

  // Memoize filtered results
  const filtered = useMemo(() => {
    return questions.filter((question) => {
      if (status === 'all') return true;
      const item = progress.questions[String(question.id)];
      const hasAttempts = Boolean(item?.attempts?.length);
      const bookmarked = Boolean(item?.bookmarked);

      if (status === 'answered') return hasAttempts;
      if (status === 'unanswered') return !hasAttempts;
      if (status === 'bookmarked') return bookmarked;
      return true;
    });
  }, [questions, status, progress.questions]);

  // Handle filter changes with smooth transition
  useEffect(() => {
    // Start transition immediately when filters change
    setIsTransitioning(true);

    // Use requestAnimationFrame to ensure the blur/overlay renders before content swaps
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDisplayQuestions(filtered);

        // 280ms transition - follows Emil's principle: fast enough to feel responsive,
        // slow enough to mask the layout reflow
        const timer = setTimeout(() => {
          setIsTransitioning(false);
        }, 280);

        return () => clearTimeout(timer);
      });
    });
  }, [filtered]);

  if (displayQuestions.length === 0 && !isTransitioning) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border-subtle bg-surface/30 px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-elevated border border-border-subtle shadow-inner">
          <Search className="h-6 w-6 text-tertiary" />
        </div>
        <div className="space-y-2">
          <p className="font-display text-xl text-foreground">No questions found</p>
          <p className="text-sm text-secondary">
            Adjust your filters or try a different search term.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Overlay that appears during transition */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-280 ${
          isTransitioning ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Blurred backdrop */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />

        {/* Subtle loading indicator */}
        <div
          className={`relative z-10 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_20px_rgba(245,158,11,0.8)] transition-transform duration-280 ${
            isTransitioning ? 'scale-100' : 'scale-0'
          }`}
        />
      </div>

      {/* Question grid with stagger animation */}
      <div
        className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-280 ease-out ${
          isTransitioning ? 'blur-[2px] scale-[0.99]' : 'blur-0 scale-100'
        }`}
        onMouseLeave={() => setHoveredId(null)}
      >
        {displayQuestions.map((question, index) => (
          // biome-ignore lint/a11y/noStaticElementInteractions: visual-only hover effect, no interaction
          <div
            key={question.id}
            onMouseEnter={() => setHoveredId(question.id)}
            className="transition-all duration-300 animate-in fade-in zoom-in-95"
            style={{
              opacity: hoveredId !== null && hoveredId !== question.id ? 0.6 : 1,
              transform: hoveredId !== null && hoveredId !== question.id ? 'scale(0.98)' : 'scale(1)',
              animationDelay: `${index * 35}ms`,
              animationDuration: '280ms',
              animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            <QuestionCard question={question} locale={locale} isHovered={hoveredId === question.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
