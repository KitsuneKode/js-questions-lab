import Link from 'next/link';

import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="py-20">
      <Container>
        <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-border bg-card/70 p-6 text-center">
          <h1 className="font-display text-4xl text-foreground">Question not found</h1>
          <p className="text-sm text-muted-foreground">The requested entry does not exist in the parsed dataset.</p>
          <Link href="/questions">
            <Button>Back to library</Button>
          </Link>
        </div>
      </Container>
    </main>
  );
}
