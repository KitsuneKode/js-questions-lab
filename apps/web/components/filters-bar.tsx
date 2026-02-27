'use client';

import { useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FiltersBarProps {
  tags: string[];
  selectedTag: string;
  search: string;
  runnable: string;
  status: string;
}

export function FiltersBar({ tags, selectedTag, search, runnable, status }: FiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const allTags = useMemo(() => ['all', ...tags], [tags]);

  function updateParam(key: string, value: string) {
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
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            defaultValue={search}
            placeholder="Search question, concept, keyword"
            className="pl-9"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                updateParam('q', (event.currentTarget as HTMLInputElement).value);
              }
            }}
          />
        </label>
        <div className="flex items-center gap-2">
          <Button variant={runnable === 'true' ? 'primary' : 'secondary'} onClick={() => updateParam('runnable', runnable === 'true' ? '' : 'true')}>
            Runnable only
          </Button>
          <Button variant="ghost" onClick={() => updateParam('q', '')}>
            Clear search
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const active = selectedTag === tag || (!selectedTag && tag === 'all');
          return (
            <button
              key={tag}
              type="button"
              onClick={() => updateParam('tag', tag)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition-colors',
                active ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground',
              )}
            >
              {active ? <Sparkles className="h-3 w-3" /> : null}
              {tag}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'answered', 'unanswered', 'bookmarked'] as const).map((entry) => {
          const active = status === entry || (!status && entry === 'all');
          return (
            <button
              key={entry}
              type="button"
              onClick={() => updateParam('status', entry)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition-colors',
                active ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground',
              )}
            >
              {entry}
            </button>
          );
        })}
      </div>

      {isPending ? <p className="text-xs text-muted-foreground">Updating results...</p> : null}
    </section>
  );
}
