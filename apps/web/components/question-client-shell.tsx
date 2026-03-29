'use client';

import confetti from 'canvas-confetti';
import {
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Play,
  Terminal,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Streamdown } from 'streamdown';

import { CodeBlock } from '@/components/code-block';
import { useScratchpad } from '@/components/scratchpad/scratchpad-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { QuestionRecord } from '@/lib/content/types';
import { useQuestionProgress } from '@/lib/progress/use-question-progress';

interface QuestionClientShellProps {
  question: QuestionRecord;
  prevId: number | null;
  nextId: number | null;
}

export function QuestionClientShell({ question, prevId, nextId }: QuestionClientShellProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isHardMode, setIsHardMode] = useState(false);
  const [hardModeAnswer, setHardModeAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const { item, saveAttempt, toggleBookmark } = useQuestionProgress(question.id);
  const { openScratchpad, setCode } = useScratchpad();

  const isAnswered = selected !== null || hasSubmitted;
  const isCorrect = isHardMode ? hasSubmitted : selected === question.correctOption;

  const cleanPromptMarkdown = question.promptMarkdown
    .replace(/```[a-z]*\n[\s\S]*?\n```/g, '')
    .trim();

  // Auto-advance logic
  useEffect(() => {
    if (isAnswered && isCorrect && nextId && autoAdvance) {
      const timer = setTimeout(() => {
        router.push(`/questions/${nextId}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAnswered, isCorrect, nextId, router, autoAdvance]);

  const handleSelect = useCallback(
    (key: 'A' | 'B' | 'C' | 'D') => {
      if (isAnswered) return;
      setSelected(key);
      const correct = key === question.correctOption;
      saveAttempt(key, correct ? 'correct' : 'incorrect');

      if (correct) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#F59E0B', '#22C55E'],
        });
      }
    },
    [isAnswered, question.correctOption, saveAttempt],
  );

  const handleHardModeSubmit = useCallback(() => {
    if (!hardModeAnswer.trim() || isAnswered) return;
    setHasSubmitted(true);
    saveAttempt(question.correctOption || 'A', 'correct');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#F59E0B', '#22C55E'],
    });
  }, [hardModeAnswer, isAnswered, question.correctOption, saveAttempt]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      if (e.key === 'ArrowLeft' && prevId) router.push(`/questions/${prevId}`);
      if (e.key === 'ArrowRight' && nextId) router.push(`/questions/${nextId}`);

      if (!isAnswered && !isHardMode) {
        const keyMap: Record<string, 'A' | 'B' | 'C' | 'D'> = {
          '1': 'A',
          '2': 'B',
          '3': 'C',
          '4': 'D',
          a: 'A',
          b: 'B',
          c: 'C',
          d: 'D',
        };
        const mapped = keyMap[e.key.toLowerCase()];
        if (mapped && question.options.some((o) => o.key === mapped)) {
          handleSelect(mapped);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevId, nextId, isAnswered, isHardMode, router, handleSelect, question.options]);

  const runInScratchpad = () => {
    if (question.codeBlocks.length > 0) {
      setCode(question.codeBlocks[0].code);
    }
    openScratchpad();
  };

  return (
    <>
      {/* Session Progress Bar */}
      <div className="fixed top-0 inset-x-0 h-[3px] bg-void z-[100]">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: `${(question.id / 155) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="max-w-[800px] mx-auto pt-8 pb-32 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {prevId ? (
              <Link href={`/questions/${prevId}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full border border-border-subtle bg-surface hover:bg-elevated hover:text-primary"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div className="w-8" />
            )}
            <span className="font-mono text-sm text-tertiary font-medium">
              Q{question.id} of 155
            </span>
            {nextId ? (
              <Link href={`/questions/${nextId}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full border border-border-subtle bg-surface hover:bg-elevated hover:text-primary"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div className="w-8" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHardMode(!isHardMode)}
              className="text-xs font-semibold text-secondary hover:text-primary transition-colors"
            >
              <Terminal className="h-3.5 w-3.5 mr-1.5" />
              {isHardMode ? 'Disable Hard Mode' : 'Hard Mode'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleBookmark}
              className={`h-8 w-8 rounded-full ${item.bookmarked ? 'text-primary' : 'text-secondary hover:text-primary'}`}
            >
              <Bookmark className={`h-4 w-4 ${item.bookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className="border-border-subtle text-tertiary bg-surface/50 font-mono text-[10px] uppercase tracking-wider"
          >
            {question.difficulty}
          </Badge>
          {question.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-elevated text-secondary font-mono text-[10px] uppercase tracking-wider"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-8">{question.title}</h1>

        {/* Prompt */}
        <div className="markdown text-lg text-secondary mb-8 leading-relaxed">
          <Streamdown>{cleanPromptMarkdown}</Streamdown>
        </div>

        {/* Code Block */}
        {question.codeBlocks.length > 0 && (
          <div className="relative group mb-10">
            <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl blur transition-opacity duration-500" />
            <div className="relative bg-code rounded-xl border border-border-subtle overflow-hidden shadow-lg">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
                  <div className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
                  <div className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={runInScratchpad}
                  className="h-7 text-xs text-code-accent hover:text-primary hover:bg-white/5 gap-1.5"
                >
                  <Play className="h-3 w-3" />
                  Run Code
                </Button>
              </div>
              <div className="p-5">
                {question.codeBlocks.map((block) => (
                  <CodeBlock key={block.id} code={block.code} language={block.language} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Answer Section */}
        <div className="space-y-4">
          {!isHardMode ? (
            <div className="flex flex-col gap-3">
              {question.options.map((option) => {
                const isSelected = selected === option.key;
                const isCorrectOption = option.key === question.correctOption;

                let stateClass =
                  'border-border-subtle bg-surface hover:border-border-focus hover:bg-elevated text-secondary';
                if (isAnswered) {
                  if (isCorrectOption)
                    stateClass =
                      'border-status-correct bg-status-correct/10 text-status-correct ring-1 ring-status-correct/30';
                  else if (isSelected)
                    stateClass = 'border-status-wrong bg-status-wrong/10 text-status-wrong';
                  else stateClass = 'border-border-subtle bg-surface opacity-40';
                } else if (isSelected) {
                  stateClass = 'border-primary bg-primary/10 text-primary';
                }

                return (
                  <motion.button
                    key={option.key}
                    whileHover={!isAnswered ? { scale: 1.01 } : {}}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    onClick={() => handleSelect(option.key)}
                    disabled={isAnswered}
                    className={`w-full text-left p-5 rounded-xl border transition-all duration-300 flex items-start gap-4 ${stateClass}`}
                  >
                    <span
                      className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded bg-black/30 border border-current/20 font-mono text-xs font-bold ${isSelected || (isAnswered && isCorrectOption) ? 'bg-current text-background border-none' : ''}`}
                    >
                      {option.key}
                    </span>
                    <span className="flex-1 text-[15px] leading-relaxed mt-0.5">{option.text}</span>
                    {isAnswered && isCorrectOption && (
                      <CheckCircle2 className="h-5 w-5 mt-1 shrink-0 text-status-correct" />
                    )}
                    {isAnswered && isSelected && !isCorrectOption && (
                      <CircleAlert className="h-5 w-5 mt-1 shrink-0 text-status-wrong" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                value={hardModeAnswer}
                onChange={(e) => setHardModeAnswer(e.target.value)}
                disabled={isAnswered}
                placeholder="Type the exact output here..."
                className="w-full min-h-[120px] bg-surface border border-border-subtle rounded-xl p-5 font-mono text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all resize-none"
              />
              {!isAnswered && (
                <Button
                  onClick={handleHardModeSubmit}
                  className="w-full h-12 bg-primary text-background font-semibold text-sm rounded-xl hover:bg-primary/90"
                >
                  Submit Answer
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Explanation Reveal */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              className="mt-12 overflow-hidden"
            >
              <div className="bg-elevated border border-border-subtle rounded-2xl p-8 relative">
                <h3 className="font-display text-2xl text-primary mb-6 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  Explanation
                </h3>
                <div className="markdown prose prose-invert max-w-none text-[15px] leading-loose text-secondary">
                  <Streamdown>{question.explanationMarkdown}</Streamdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Question Auto-advance UI */}
        <AnimatePresence>
          {isAnswered && isCorrect && nextId && autoAdvance && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-surface border border-border-focus px-6 py-4 rounded-2xl shadow-glow flex items-center gap-4 z-40"
            >
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm font-medium text-foreground">
                Advancing to next question...
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAutoAdvance(false)}
                className="ml-2 h-8 text-xs bg-elevated hover:bg-white/10 text-secondary border-border-subtle"
              >
                Stay
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
