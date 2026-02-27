import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Container } from '@/components/container';
import { LandingHero } from '@/components/landing-hero';
import { TagDistribution } from '@/components/tag-distribution';
import { QuestionCard } from '@/components/question-card';
import { Button } from '@/components/ui/button';
import { getManifest, getQuestions } from '@/lib/content/loaders';

export default function HomePage() {
  const manifest = getManifest();
  const questions = getQuestions();

  const featured = questions.slice(0, 6);

  const tagCounts = Object.entries(
    questions.flatMap((question) => question.tags).reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([tag, count]) => ({ tag, count }));

  return (
    <main>
      <Container>
        <LandingHero total={manifest.totals.questions} runnable={manifest.totals.runnable} tagCount={manifest.tags.length} />

        <section className="grid gap-6 pb-8 lg:grid-cols-[1fr_1fr]">
          <TagDistribution values={tagCounts} />
          <div className="rounded-xl border border-border bg-card/60 p-5 md:p-6">
            <h2 className="font-display text-2xl text-foreground">Study Workflow</h2>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="rounded-lg border border-border bg-card/60 p-3">1. Pick a question by tag or search phrase.</li>
              <li className="rounded-lg border border-border bg-card/60 p-3">2. Answer in quiz mode before seeing the explanation.</li>
              <li className="rounded-lg border border-border bg-card/60 p-3">3. Dry-run editable code and inspect event-loop timeline output.</li>
              <li className="rounded-lg border border-border bg-card/60 p-3">4. Bookmark difficult items and revisit from pagination pages.</li>
            </ol>
            <Link href="/questions" className="mt-4 inline-flex">
              <Button className="mt-4">
                Browse all questions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="pb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-foreground">Featured Questions</h2>
            <Link href="/questions" className="text-sm text-primary">
              View all {questions.length}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
