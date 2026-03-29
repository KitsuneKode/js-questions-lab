import {
  IconChevronLeft as ChevronLeft,
  IconChevronRight as ChevronRight,
} from '@tabler/icons-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationNavProps {
  page: number;
  pageCount: number;
  createHref: (page: number) => string;
}

export function PaginationNav({ page, pageCount, createHref }: PaginationNavProps) {
  if (pageCount <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2 py-8" aria-label="Pagination">
      <Link
        href={createHref(Math.max(1, page - 1))}
        className={cn(page <= 1 && 'pointer-events-none')}
        aria-disabled={page <= 1}
      >
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-9 gap-1.5 px-3 text-xs font-medium', page <= 1 && 'opacity-40')}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
      </Link>

      {/* Page indicator pills */}
      <div className="flex items-center gap-1 px-2">
        {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
          // Smart pagination: show first, last, current, and neighbors
          let pageNum: number;
          if (pageCount <= 7) {
            pageNum = i + 1;
          } else if (i === 0) {
            pageNum = 1;
          } else if (i === 6) {
            pageNum = pageCount;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= pageCount - 2) {
            pageNum = pageCount - 6 + i;
          } else {
            pageNum = page - 3 + i;
          }

          const isActive = pageNum === page;
          const showEllipsis =
            pageCount > 7 && ((i === 1 && page > 4) || (i === 5 && page < pageCount - 3));

          if (showEllipsis) {
            return (
              <span
                key={`ellipsis-${pageNum}`}
                className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground/40"
              >
                ...
              </span>
            );
          }

          return (
            <Link key={pageNum} href={createHref(pageNum)}>
              <button
                type="button"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md font-mono text-xs font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {pageNum}
              </button>
            </Link>
          );
        })}
      </div>

      <Link
        href={createHref(Math.min(pageCount, page + 1))}
        className={cn(page >= pageCount && 'pointer-events-none')}
        aria-disabled={page >= pageCount}
      >
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-9 gap-1.5 px-3 text-xs font-medium', page >= pageCount && 'opacity-40')}
          disabled={page >= pageCount}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </nav>
  );
}
