'use client';

import { IconFlame as Flame, IconSearch as Search, IconX as X } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { QuestionRecord } from '@/lib/content/types';
import { cn } from '@/lib/utils';

interface FiltersBarProps {
  tags: string[];
  selectedTags?: string[];
  selectedTag?: string;
  search: string;
  runnable: string;
  status: string;
  difficulties?: string[];
  difficulty?: string;
  allQuestions: QuestionRecord[];
  locale: string;
}

export function FiltersBar({
  tags,
  selectedTags,
  selectedTag,
  search,
  runnable,
  status,
  difficulties,
  difficulty,
  allQuestions,
  locale,
}: FiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(search);

  // Support legacy single-tag mode or new multi-tag mode
  const activeTags = useMemo(() => {
    if (selectedTags && selectedTags.length > 0) return selectedTags;
    if (selectedTag && selectedTag !== 'all') return [selectedTag];
    return [] as string[];
  }, [selectedTags, selectedTag]);

  const activeDifficulties = useMemo(() => {
    if (difficulties && difficulties.length > 0) return difficulties;
    if (difficulty) return [difficulty];
    return [] as string[];
  }, [difficulties, difficulty]);

  const allTags = useMemo(() => ['all', ...tags], [tags]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.set('page', '1');

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');

      if (tag === 'all') {
        // Clear all tags
        params.delete('tags');
        params.delete('tag');
      } else {
        // Get current tags
        const currentTags = params.getAll('tags');
        if (currentTags.includes(tag)) {
          // Remove tag
          params.delete('tags');
          currentTags.filter((t) => t !== tag).forEach((t) => void params.append('tags', t));
        } else {
          // Add tag
          params.append('tags', tag);
        }
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  const toggleDifficulty = useCallback(
    (diff: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');

      const currentDiffs = params.getAll('difficulties');
      if (currentDiffs.includes(diff)) {
        // Remove difficulty
        params.delete('difficulties');
        currentDiffs.filter((d) => d !== diff).forEach((d) => void params.append('difficulties', d));
      } else {
        // Add difficulty
        params.append('difficulties', diff);
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  const resetTags = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tags');
    params.delete('tag');
    params.set('page', '1');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [pathname, router, searchParams]);

  const resetDifficulties = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('difficulties');
    params.delete('difficulty');
    params.set('page', '1');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== search) {
        updateParam('q', inputValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, search, updateParam]);

  return (
    <section className="space-y-6">
      {/* Horizontal Pill Filter Bar for Topics with Multi-Select */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full max-w-full">
        {allTags.map((tag) => {
          const isActive = tag === 'all' ? activeTags.length === 0 : activeTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                'relative px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-full',
                isActive ? 'text-primary' : 'text-secondary hover:text-foreground hover:bg-surface',
              )}
            >
              {tag === 'all' ? 'All Questions' : tag.charAt(0).toUpperCase() + tag.slice(1)}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 border-2 border-primary rounded-full bg-primary/5"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
        {activeTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetTags}
            className="h-8 px-3 text-xs text-tertiary hover:text-foreground ml-2 active:scale-[0.95] transition-all"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Reset Tags ({activeTags.length})
          </Button>
        )}
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center justify-between w-full sm:w-[280px] h-10 bg-surface border border-border-subtle rounded-lg px-3 text-sm text-tertiary hover:border-primary/40 hover:bg-elevated transition-all group active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-tertiary group-hover:text-primary transition-colors" />
              {search ? `Search: "${search}"` : 'Search questions...'}
            </span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border-subtle bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          <CommandDialog open={open} onOpenChange={setOpen}>
            <Command className="flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-popover shadow-2xl">
              <CommandInput
                placeholder="Type a keyword, concept, or question number..."
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList className="h-[400px]">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Questions">
                  {allQuestions
                    .filter(
                      (q) =>
                        q.title.toLowerCase().includes((inputValue || '').toLowerCase()) ||
                        q.tags.some((t) =>
                          t.toLowerCase().includes((inputValue || '').toLowerCase()),
                        ),
                    )
                    .slice(0, 10)
                    .map((q) => (
                      <CommandItem
                        key={q.id}
                        onSelect={() => {
                          setOpen(false);
                          router.push(`/${locale}/questions/${q.id}`);
                        }}
                        className="flex cursor-pointer items-center justify-between py-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-tertiary">#{q.id}</span>
                          <span className="text-sm font-medium text-foreground">{q.title}</span>
                        </div>
                        <div className="flex gap-2">
                          {q.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-tertiary"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </CommandDialog>

          {/* Difficulty Multi-Select */}
          <div className="flex items-center gap-1.5 bg-surface border border-border-subtle rounded-lg p-1">
            {(['beginner', 'intermediate', 'advanced'] as const).map((diff) => {
              const isActive = activeDifficulties.includes(diff);
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => toggleDifficulty(diff)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md capitalize transition-all duration-200 active:scale-[0.95]',
                    isActive
                      ? 'bg-primary text-background shadow-[0_0_20px_rgba(245,158,11,0.3)] font-semibold'
                      : 'text-secondary hover:text-foreground hover:bg-elevated border border-transparent hover:border-border-subtle',
                  )}
                >
                  {diff}
                </button>
              );
            })}
            {activeDifficulties.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetDifficulties}
                className="h-7 px-2 text-[10px] text-tertiary hover:text-foreground ml-1 active:scale-[0.95] transition-all"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => updateParam('runnable', runnable === 'true' ? '' : 'true')}
            className={cn(
              'flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg border transition-all duration-300 active:scale-[0.95]',
              runnable === 'true'
                ? 'bg-primary text-background border-primary shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                : 'bg-surface border-border-subtle text-secondary hover:bg-elevated hover:border-border-focus',
            )}
          >
            <Flame
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-500',
                runnable === 'true' ? 'fill-current scale-110' : 'group-hover:scale-110',
              )}
            />
            Hard Mode Only
          </button>

          {(search ||
            activeTags.length > 0 ||
            runnable === 'true' ||
            (status && status !== 'all') ||
            activeDifficulties.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-tertiary hover:text-foreground h-9 active:scale-[0.95] transition-all"
              onClick={() => {
                startTransition(() => {
                  router.push(pathname);
                });
              }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
            Filtering...
          </p>
        </div>
      )}
    </section>
  );
}
