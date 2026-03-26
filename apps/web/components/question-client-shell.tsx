'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bookmark, CheckCircle2, CircleAlert, ChevronLeft, ChevronRight, Terminal, Sparkles } from 'lucide-react';

import type { QuestionRecord } from '@/lib/content/types';
import type { TimelineEvent } from '@/lib/run/types';
import { useQuestionProgress } from '@/lib/progress/use-question-progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/code-block';
import { Streamdown } from 'streamdown';

const CodePlayground = dynamic(
  () => import('@/components/code-playground').then((mod) => mod.CodePlayground),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12 border border-border/40 rounded-xl bg-card/20 animate-pulse">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Initializing Engine...</p>
      </div>
    ),
  },
);

const ExecutionFlow = dynamic(
  () => import('@/components/visualization/execution-flow').then((mod) => mod.ExecutionFlow),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12 border border-border/40 rounded-xl bg-card/20 animate-pulse">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Booting Visualizer...</p>
      </div>
    ),
  },
);

interface QuestionClientShellProps {
  question: QuestionRecord;
  prevId: number | null;
  nextId: number | null;
}

export function QuestionClientShell({ question, prevId, nextId }: QuestionClientShellProps) {
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isRecallMode, setIsRecallMode] = useState(false);
  const [recallAnswer, setRecallAnswer] = useState('');
  const [hasSubmittedRecall, setHasSubmittedRecall] = useState(false);
  const [selfGrade, setSelfGrade] = useState<'hard' | 'good' | 'easy' | null>(null);
  
  const [activeTab, setActiveTab] = useState<'explain' | 'run' | 'visualize'>('explain');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const { ready, item, saveAttempt, toggleBookmark, saveSelfGrade } = useQuestionProgress(question.id);

  const isAnswered = selected !== null || hasSubmittedRecall;
  const isCorrect = selected !== null ? selected === question.correctOption : hasSubmittedRecall; // In recall mode, any submission acts as correct to reveal the answer.
  const answerTone = isCorrect ? 'success' : 'danger';

  function handleRecallSubmit() {
    if (!recallAnswer.trim()) return;
    
    if (!question.correctOption) {
      console.warn('Question missing correctOption, cannot save attempt');
      setHasSubmittedRecall(true);
      return;
    }
    
    setHasSubmittedRecall(true);
    saveAttempt(question.correctOption, 'correct');
  }

  function handleSelfGrade(grade: 'hard' | 'good' | 'easy') {
    setSelfGrade(grade);
    saveSelfGrade(grade);
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header Area */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-border/40 pb-8">
        <div className="flex items-center gap-4">
          {prevId ? (
            <Link href={`/questions/${prevId}`}>
              <Button variant="ghost" size="sm" className="h-10 w-10 shrink-0 rounded-full bg-card/50 hover:bg-muted p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div className="w-10" />
          )}
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">{question.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="px-2 py-0.5 text-[10px] uppercase tracking-widest opacity-80">
                #{question.id}
              </Badge>
              <Badge variant="outline" className="px-2 py-0.5 text-[10px] uppercase tracking-widest border-border/60">
                {question.difficulty}
              </Badge>
              {question.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-muted/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={item.bookmarked ? 'primary' : 'secondary'}
            size="sm"
            onClick={toggleBookmark}
            className={`h-10 px-5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${item.bookmarked ? 'shadow-md shadow-primary/20' : ''}`}
          >
            <Bookmark className={`mr-2 h-4 w-4 ${item.bookmarked ? 'fill-current text-primary-foreground' : 'text-muted-foreground'}`} />
            {item.bookmarked ? 'Saved' : 'Save'}
          </Button>
          {nextId && (
            <Link href={`/questions/${nextId}`}>
              <Button variant="secondary" size="sm" className="h-10 gap-2 px-5 text-xs font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Workstation Grid */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        {/* Left Pane: Question Reading */}
        <div className="space-y-10">
          <section className="space-y-6">
            <div className="prose prose-invert max-w-none text-base leading-relaxed text-muted-foreground/90 markdown">
              <Streamdown>{question.promptMarkdown}</Streamdown>
            </div>

            {question.codeBlocks.length > 0 && (
              <div className="space-y-4">
                {question.codeBlocks.map((codeBlock) => (
                  <CodeBlock
                    key={codeBlock.id}
                    code={codeBlock.code}
                    language={codeBlock.language}
                  />
                ))}
              </div>
            )}
          </section>

          <AnimatePresence>
            {isAnswered && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card/40 to-black/20 p-8 shadow-2xl">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="h-24 w-24" />
                  </div>
                  <h3 className="mb-6 font-display text-xl font-medium tracking-tight text-foreground flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary ring-1 ring-primary/30">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    Detailed Explanation
                  </h3>
                  <div className="markdown prose prose-invert max-w-none text-sm leading-loose text-muted-foreground/90">
                    <Streamdown>{question.explanationMarkdown}</Streamdown>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right Pane: Practice Area */}
        <div className="lg:sticky lg:top-8 lg:max-h-[calc(100vh-64px)] lg:overflow-y-auto lg:pr-2 lg:pb-8 scrollbar-hide">
          <div className="space-y-8">
            {/* Quiz / Hard Mode Section */}
            <Card className="overflow-hidden border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl">
              <CardHeader className="border-b border-border/30 bg-muted/5 pb-4 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-foreground/80">
                    {isRecallMode ? 'Active Recall' : 'Select Output'}
                  </CardTitle>
                  {!isAnswered && (
                    <button
                      type="button"
                      onClick={() => setIsRecallMode(!isRecallMode)}
                      className="group flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 transition-colors hover:text-primary"
                    >
                      {isRecallMode ? 'Switch to Quiz' : 'Hard Mode'}
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-background transition-colors">
                        <Terminal className="h-2.5 w-2.5" />
                      </span>
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!isRecallMode ? (
                  <div className="grid gap-3">
                    {question.options.map((option) => {
                      const disabled = isAnswered;
                      const picked = selected === option.key;
                      const correct = option.key === question.correctOption;

                      let optionStyles = 'border-border/40 bg-black/20 text-foreground/80 hover:bg-muted/30 hover:border-border/80';
                      if (isAnswered) {
                        if (correct) {
                          optionStyles = 'border-success/40 bg-success/10 text-success ring-1 ring-success/20';
                        } else if (picked) {
                          optionStyles = 'border-danger/40 bg-danger/10 text-danger ring-1 ring-danger/20';
                        } else {
                          optionStyles = 'border-border/20 bg-black/10 text-muted-foreground/40 opacity-50';
                        }
                      }

                      return (
                        <button
                          key={option.key}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (isAnswered) return;
                            setSelected(option.key);
                            saveAttempt(option.key, option.key === question.correctOption ? 'correct' : 'incorrect');
                          }}
                          className={`group flex items-start gap-4 rounded-xl border p-4 text-left text-sm transition-all duration-300 ${optionStyles} ${
                            !disabled ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 shadow-sm hover:shadow-md' : 'cursor-default'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded bg-black/40 border border-border/50 font-display text-xs font-semibold transition-colors ${
                              picked || (correct && isAnswered)
                                ? 'bg-current/10 border-current text-current'
                                : 'group-hover:bg-foreground/10 group-hover:text-foreground'
                            }`}
                          >
                            {option.key}
                          </span>
                          <span className="flex-1 leading-snug">{option.text}</span>
                          {isAnswered && correct && (
                            <CheckCircle2 className="h-5 w-5 shrink-0 animate-in zoom-in duration-300" />
                          )}
                          {isAnswered && picked && !correct && (
                            <CircleAlert className="h-5 w-5 shrink-0 animate-in zoom-in duration-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="relative">
                      <div className="absolute -left-3 -top-3 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
                      <textarea
                        value={recallAnswer}
                        onChange={(e) => setRecallAnswer(e.target.value)}
                        disabled={isAnswered}
                        placeholder="Type the exact output here (e.g. undefined, TypeError...)"
                        className="relative min-h-[140px] w-full resize-none rounded-xl border border-border/50 bg-[#0a0a0c] p-5 font-mono text-sm leading-relaxed text-[#e2e8f0] shadow-inner placeholder:text-muted-foreground/30 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70 transition-all"
                      />
                    </div>
                    {!isAnswered && (
                      <Button onClick={handleRecallSubmit} className="w-full h-12 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        Submit Answer
                      </Button>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 space-y-6 overflow-hidden"
                    >
                      {!isRecallMode && (
                        <div
                          className={`flex items-center gap-3 rounded-xl border p-4 text-sm font-medium ${
                            isCorrect
                              ? 'border-success/30 bg-success/10 text-success'
                              : 'border-danger/30 bg-danger/10 text-danger'
                          }`}
                        >
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                          ) : (
                            <CircleAlert className="h-5 w-5 shrink-0" />
                          )}
                          <span>
                            {isCorrect ? 'Great work! That is correct.' : `Incorrect. The correct answer is ${question.correctOption}.`}
                          </span>
                        </div>
                      )}

                      {/* Spaced Repetition Self-Grading */}
                      <div className="rounded-xl border border-border/40 bg-black/20 p-5 shadow-inner">
                        <div className="mb-4 text-center">
                          <p className="font-display text-sm font-medium text-foreground">How well did you know this?</p>
                          <p className="text-xs text-muted-foreground mt-1">Grade yourself to schedule the next review.</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => handleSelfGrade('hard')}
                            className={`flex flex-col items-center justify-center rounded-xl border p-3 transition-all duration-300 hover:scale-105 active:scale-95 ${
                              selfGrade === 'hard'
                                ? 'bg-danger/20 border-danger/50 text-danger ring-1 ring-danger/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                : 'border-border/40 bg-card hover:bg-muted/40 hover:border-danger/30 text-muted-foreground'
                            }`}
                          >
                            <span className="text-xs font-bold uppercase tracking-widest">Hard</span>
                            <span className="mt-1 text-[10px] font-medium opacity-60">1 min</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelfGrade('good')}
                            className={`flex flex-col items-center justify-center rounded-xl border p-3 transition-all duration-300 hover:scale-105 active:scale-95 ${
                              selfGrade === 'good'
                                ? 'bg-warning/20 border-warning/50 text-warning ring-1 ring-warning/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'border-border/40 bg-card hover:bg-muted/40 hover:border-warning/30 text-muted-foreground'
                            }`}
                          >
                            <span className="text-xs font-bold uppercase tracking-widest">Good</span>
                            <span className="mt-1 text-[10px] font-medium opacity-60">1 day</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelfGrade('easy')}
                            className={`flex flex-col items-center justify-center rounded-xl border p-3 transition-all duration-300 hover:scale-105 active:scale-95 ${
                              selfGrade === 'easy'
                                ? 'bg-success/20 border-success/50 text-success ring-1 ring-success/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                : 'border-border/40 bg-card hover:bg-muted/40 hover:border-success/30 text-muted-foreground'
                            }`}
                          >
                            <span className="text-xs font-bold uppercase tracking-widest">Easy</span>
                            <span className="mt-1 text-[10px] font-medium opacity-60">4 days</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Playground & Visualization Tabs */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'explain' | 'run' | 'visualize')}>
                    <div className="mb-4 flex items-center justify-between border-b border-border/30 pb-3">
                      <TabsList className="h-auto bg-transparent p-0 gap-6">
                        <TabsTrigger
                          value="run"
                          className="relative rounded-none border-b-2 border-transparent px-0 pb-2 pt-0 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                          Code Runner
                        </TabsTrigger>
                        <TabsTrigger
                          value="visualize"
                          className="relative rounded-none border-b-2 border-transparent px-0 pb-2 pt-0 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                          Event Loop
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="run" className="mt-0 focus-visible:outline-none">
                      <Card className="border-border/50 bg-black/30 shadow-2xl backdrop-blur-sm">
                        <CardContent className="p-0">
                          <CodePlayground question={question} onTimelineUpdate={setTimeline} />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="visualize" className="mt-0 focus-visible:outline-none">
                      <ExecutionFlow question={question} timeline={timeline} />
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>

            {ready && item.attempts.length > 0 && (
              <div className="flex items-center justify-center gap-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                <div className="h-1.5 w-1.5 rounded-full bg-success/40" />
                Last practiced: {new Date(item.attempts[item.attempts.length - 1].attemptedAt).toLocaleDateString()} • {item.attempts.length} attempts
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
