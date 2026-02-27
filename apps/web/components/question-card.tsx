import Link from 'next/link';
import { ArrowUpRight, Brain, PlayCircle } from 'lucide-react';

import type { QuestionRecord } from '@/lib/content/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface QuestionCardProps {
  question: QuestionRecord;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Card className="question-grid-item group h-full transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>#{question.id}</Badge>
          <Badge>{question.difficulty}</Badge>
          {question.runnable ? <Badge tone="success">runnable</Badge> : <Badge tone="warning">read-only</Badge>}
        </div>
        <CardTitle className="line-clamp-2 text-xl leading-tight">{question.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {question.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full border border-border bg-muted/70 px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Brain className="h-4 w-4" />
            {question.options.length} options
          </span>
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            {question.runnable ? <PlayCircle className="h-4 w-4" /> : null}
            {question.codeBlocks.length} code block{question.codeBlocks.length === 1 ? '' : 's'}
          </span>
        </div>
        <Link
          href={`/questions/${question.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Open question
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
