import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface PaginationNavProps {
  page: number;
  pageCount: number;
  createHref: (page: number) => string;
}

export function PaginationNav({ page, pageCount, createHref }: PaginationNavProps) {
  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <Link href={createHref(Math.max(1, page - 1))} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : 0}>
        <Button variant="secondary" disabled={page <= 1}>
          Previous
        </Button>
      </Link>
      <span className="px-3 text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      <Link href={createHref(Math.min(pageCount, page + 1))} aria-disabled={page >= pageCount} tabIndex={page >= pageCount ? -1 : 0}>
        <Button variant="secondary" disabled={page >= pageCount}>
          Next
        </Button>
      </Link>
    </nav>
  );
}
