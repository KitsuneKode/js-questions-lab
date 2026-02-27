'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, CheckCircle2, CircleAlert, ChevronLeft, ChevronRight } from 'lucide-react';

import type { QuestionRecord } from '@/lib/content/types';
import { useQuestionProgress } from '@/lib/progress/use-question-progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Markdown } from '@/components/markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CodePlayground = dynamic(
  () => import('@/components/code-playground').then((mod) => mod.CodePlayground),
  {
    ssr: false,
    loading: () => <p className="text-sm text-muted-foreground">Loading playground...</p>,
  },
);

interface QuestionClientShellProps {
  question: QuestionRecord;
  prevId: number | null;
  nextId: number | null;
}

export function QuestionClientShell({ question, prevId, nextId }: QuestionClientShellProps) {
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [activeTab, setActiveTab] = useState<'explain' | 'run' | 'visualize'>('explain');

  const { ready, item, saveAttempt, toggleBookmark } = useQuestionProgress(question.id);

  const isAnswered = selected !== null;
  const isCorrect = selected !== null && selected === question.correctOption;
  const answerTone = isCorrect ? 'success' : 'danger';

  const conceptualFlow = useMemo(() => {
    if (question.tags.includes('async')) {
      return ['Synchronous execution starts', 'Async tasks enqueue in micro/macro queues', 'Call stack clears', 'Microtasks resolve before macrotasks'];
    }

    if (question.tags.includes('scope')) {
      return ['Execution context is created', 'Declarations are hoisted', 'Scopes are resolved by lexical chain', 'Runtime output follows scope rules'];
    }

    if (question.tags.includes('objects')) {
      return ['Values are assigned', 'Reference/value behavior applies', 'Mutations propagate by reference', 'Output reflects object identity'];
    }

    return ['Read question prompt', 'Pick an answer option', 'Reveal explanation', 'Run and inspect behavior'];
  }, [question.tags]);

  useEffect(() => {
    setSelected(null);
    setActiveTab('explain');
  }, [question.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Question #{question.id}</Badge>
          <Badge>{question.difficulty}</Badge>
          {question.runnable ? <Badge tone="success">runnable</Badge> : <Badge tone="warning">read-only</Badge>}
          {question.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant={item.bookmarked ? 'primary' : 'secondary'} onClick={toggleBookmark}>
            <Bookmark className="mr-2 h-4 w-4" />
            {item.bookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
          {prevId ? (
            <Link href={`/questions/${prevId}`}>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          ) : null}
          {nextId ? (
            <Link href={`/questions/${nextId}`}>
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">{question.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {question.promptMarkdown ? <Markdown content={question.promptMarkdown} /> : null}

          {question.codeBlocks.length > 0 ? (
            <div className="space-y-3">
              {question.codeBlocks.map((codeBlock) => (
                <div key={codeBlock.id} className="overflow-hidden rounded-lg border border-border bg-black/25">
                  <div className="border-b border-border px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">{codeBlock.language}</div>
                  <pre className="overflow-x-auto p-4 text-xs text-foreground">
                    <code>{codeBlock.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            {question.options.map((option) => {
              const disabled = isAnswered;
              const picked = selected === option.key;
              const correct = option.key === question.correctOption;

              return (
                <button
                  key={option.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (isAnswered) {
                      return;
                    }
                    setSelected(option.key);
                    const status = option.key === question.correctOption ? 'correct' : 'incorrect';
                    saveAttempt(option.key, status);
                  }}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    picked && !correct ? 'border-danger/60 bg-danger/10 text-danger' : ''
                  } ${correct && isAnswered ? 'border-success/60 bg-success/10 text-success' : ''} ${
                    !picked && !correct ? 'border-border bg-muted/20 text-foreground hover:bg-muted/40' : ''
                  } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className="mr-2 inline-block w-6 font-display text-base">{option.key}</span>
                  <span>{option.text}</span>
                </button>
              );
            })}
          </div>

          {isAnswered ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg border p-3 text-sm ${
                answerTone === 'success'
                  ? 'border-success/50 bg-success/10 text-success'
                  : 'border-danger/50 bg-danger/10 text-danger'
              }`}
            >
              <p className="inline-flex items-center gap-2">
                {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                {isCorrect ? 'Correct answer.' : `Not quite. Correct answer is ${question.correctOption}.`}
              </p>
            </motion.div>
          ) : (
            <p className="text-sm text-muted-foreground">Select an option to reveal explanation, dry-run, and visualization tabs.</p>
          )}

          {ready && item.attempts.length > 0 ? (
            <p className="text-xs text-muted-foreground">Attempts saved locally: {item.attempts.length}</p>
          ) : null}
        </CardContent>
      </Card>

      {isAnswered ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Deep Dive</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'explain' | 'run' | 'visualize')}>
              <TabsList>
                <TabsTrigger value="explain">Explain</TabsTrigger>
                <TabsTrigger value="run">Run</TabsTrigger>
                <TabsTrigger value="visualize">Visualize</TabsTrigger>
              </TabsList>

              <TabsContent value="explain">
                <Markdown content={question.explanationMarkdown} />
              </TabsContent>

              <TabsContent value="run">
                <CodePlayground question={question} />
              </TabsContent>

              <TabsContent value="visualize">
                <div className="space-y-4 rounded-lg border border-border bg-black/10 p-4">
                  <p className="text-sm text-muted-foreground">Concept sequence for this question</p>
                  <ol className="space-y-2">
                    {conceptualFlow.map((step, index) => (
                      <li key={step} className="flex items-start gap-3 rounded-md border border-border bg-card/70 p-3 text-sm">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">{index + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs text-muted-foreground">
                    Run tab contains live timeline instrumentation for console, microtasks, and macrotasks.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
