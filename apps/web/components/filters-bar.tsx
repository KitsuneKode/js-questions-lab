'use client';

import {
  IconFlame as Flame,
  IconProgress as Progress,
  IconSearch as Search,
  IconX as X,
} from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionProgressTracker } from '@/components/section-progress-tracker';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { QuestionRecord } from '@/lib/content/types';
import { useFilterPending } from '@/lib/filters/filter-pending-context';
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
  const { startTransition } = useFilterPending();

  // Local state gives immediate visual feedback on click; useEffect syncs when
  // navigation settles and new props arrive from the server component.
  const [activeTags, setActiveTags] = useState<string[]>(() =>
    selectedTags?.length ? selectedTags : selectedTag && selectedTag !== 'all' ? [selectedTag] : [],
  );
  const [activeDifficulties, setActiveDifficulties] = useState<string[]>(() =>
    difficulties?.length ? difficulties : difficulty ? [difficulty] : [],
  );

  useEffect(() => {
    setActiveTags(
      selectedTags?.length
        ? selectedTags
        : selectedTag && selectedTag !== 'all'
          ? [selectedTag]
          : [],
    );
  }, [selectedTags, selectedTag]);

  useEffect(() => {
    setActiveDifficulties(difficulties?.length ? difficulties : difficulty ? [difficulty] : []);
  }, [difficulties, difficulty]);

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(search);

  // Open command dialog with Ctrl/Cmd + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);
  const [progressOpen, setProgressOpen] = useState(false);

  const allTags = useMemo(() => ['all', ...tags], [tags]);

  // Calculate question counts per tag
  const questionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tags.forEach((tag) => {
      counts[tag] = allQuestions.filter((q) => q.tags.includes(tag)).length;
    });
    return counts;
  }, [tags, allQuestions]);

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
    [pathname, router, searchParams, startTransition],
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const newTags =
        tag === 'all'
          ? []
          : activeTags.includes(tag)
            ? activeTags.filter((t) => t !== tag)
            : [...activeTags, tag];

      setActiveTags(newTags); // immediate visual update

      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');

      if (tag === 'all') {
        params.delete('tags');
        params.delete('tag');
      } else {
        params.delete('tags');
        newTags.forEach((t) => void params.append('tags', t));
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, activeTags, startTransition],
  );

  const toggleDifficulty = useCallback(
    (diff: string) => {
      const newDiffs = activeDifficulties.includes(diff)
        ? activeDifficulties.filter((d) => d !== diff)
        : [...activeDifficulties, diff];

      setActiveDifficulties(newDiffs); // immediate visual update

      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      params.delete('difficulties');
      newDiffs.forEach((d) => void params.append('difficulties', d));

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, activeDifficulties, startTransition],
  );

  const resetTags = useCallback(() => {
    setActiveTags([]);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('tags');
    params.delete('tag');
    params.set('page', '1');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [pathname, router, searchParams, startTransition]);

  const resetDifficulties = useCallback(() => {
    setActiveDifficulties([]);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('difficulties');
    params.delete('difficulty');
    params.set('page', '1');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [pathname, router, searchParams, startTransition]);

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
                'relative px-4 py-2 text-sm font-medium whitespace-nowrap transition-all rounded-full',
                isActive
                  ? 'text-primary bg-primary/5 border-2 border-primary shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'text-secondary hover:text-foreground hover:bg-surface border-2 border-transparent',
              )}
            >
              {tag === 'all' ? 'All Questions' : tag.charAt(0).toUpperCase() + tag.slice(1)}
            </button>
          );
        })}
        {activeTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetTags}
            className="h-8 px-3 text-xs text-tertiary hover:text-foreground ml-2 active:scale-[0.95] transition-all border-2 border-transparent"
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
            className="flex items-center justify-between w-full sm:w-[280px] h-10 bg-surface/60 backdrop-blur-md border border-border-subtle/80 rounded-lg px-3 text-sm text-tertiary hover:border-primary/40 hover:bg-elevated/80 transition-all group active:scale-[0.98]"
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
                      ? 'bg-primary text-background shadow-[0_0_15px_rgba(245,158,11,0.25)] font-semibold border-2 border-primary'
                      : 'text-secondary hover:text-foreground hover:bg-elevated border-2 border-transparent hover:border-border-subtle',
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
                className="h-7 px-2 text-[10px] text-tertiary hover:text-foreground ml-1 active:scale-[0.95] transition-all border-2 border-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Tracker Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProgressOpen(true)}
            className="h-9 gap-2 text-xs font-medium border-border-subtle hover:border-primary/40 transition-all active:scale-[0.95]"
          >
            <Progress className="h-4 w-4" />
            Progress
          </Button>

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
                setActiveTags([]);
                setActiveDifficulties([]);
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

      {/* Progress Tracker Dialog */}
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Progress</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <SectionProgressTracker
              availableTags={tags}
              questionCounts={questionCounts}
              onSectionClick={(tag) => {
                toggleTag(tag);
                setProgressOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
