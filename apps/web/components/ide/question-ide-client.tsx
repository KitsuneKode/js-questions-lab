'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  CircleAlert,
  Terminal,
  Sparkles,
  Bookmark,
  Code2,
  Zap
} from 'lucide-react';

import { MonacoCodeEditor } from '@/components/editor/monaco-code-editor';
import { TerminalOutput } from '@/components/terminal/terminal-output';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Streamdown } from 'streamdown';
import type { QuestionRecord } from '@/lib/content/types';
import type { TimelineEvent } from '@/lib/run/types';
import { runJavaScriptInSandbox } from '@/lib/run/sandbox';
import { useQuestionProgress } from '@/lib/progress/use-question-progress';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable-panel';

interface QuestionIDEClientProps {
  question: QuestionRecord;
  prevId: number | null;
  nextId: number | null;
}

interface LogEntry {
  type: 'log' | 'warn' | 'error' | 'info';
  content: string;
  timestamp: number;
}

const EDITOR_DEFAULT_CODE = `// Write your code here
// Press Ctrl/Cmd + Enter to run

console.log("Hello, JavaScript!");

const arr = [1, 2, 3, 4, 5];
const sum = arr.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);
`;

export function QuestionIDEClient({ question, prevId, nextId }: QuestionIDEClientProps) {
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isRecallMode, setIsRecallMode] = useState(false);
  const [recallAnswer, setRecallAnswer] = useState('');
  const [hasSubmittedRecall, setHasSubmittedRecall] = useState(false);
  const [selfGrade, setSelfGrade] = useState<'hard' | 'good' | 'easy' | null>(null);
  
  const [code, setCode] = useState(question.codeBlocks[0]?.code || EDITOR_DEFAULT_CODE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'practice' | 'scratchpad'>('practice');

  const { ready, item, saveAttempt, toggleBookmark, saveSelfGrade } = useQuestionProgress(question.id);

  const isAnswered = selected !== null || hasSubmittedRecall;
  const isCorrect = selected !== null ? selected === question.correctOption : hasSubmittedRecall;

  const runCode = useCallback(async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setLogs([]);

    try {
      const result = await runJavaScriptInSandbox(code);
      const newLogs: LogEntry[] = [];
      const now = Date.now();
      
      result.logs.forEach((log, i) => {
        let type: LogEntry['type'] = 'log';
        if (log.startsWith('[warn]')) type = 'warn';
        else if (log.startsWith('[info]')) type = 'info';
        newLogs.push({
          type,
          content: log.replace(/^\[(log|warn|error|info)\]\s*/, ''),
          timestamp: now + i,
        });
      });
      
      result.errors.forEach((err, i) => {
        newLogs.push({
          type: 'error',
          content: err,
          timestamp: now + result.logs.length + i,
        });
      });
      
      setLogs(newLogs);
    } catch (error) {
      setLogs([{ type: 'error', content: String(error), timestamp: Date.now() }]);
    } finally {
      setIsRunning(false);
    }
  }, [code]);

  const handleRecallSubmit = useCallback(() => {
    if (!recallAnswer.trim()) return;
    if (!question.correctOption) {
      setHasSubmittedRecall(true);
      return;
    }
    setHasSubmittedRecall(true);
    saveAttempt(question.correctOption, 'correct');
  }, [recallAnswer, question.correctOption, saveAttempt]);

  const handleSelfGrade = useCallback((grade: 'hard' | 'good' | 'easy') => {
    setSelfGrade(grade);
    saveSelfGrade(grade);
  }, [saveSelfGrade]);

  const handleOptionSelect = useCallback((key: string) => {
    if (isAnswered) return;
    const optionKey = key as 'A' | 'B' | 'C' | 'D';
    setSelected(optionKey);
    saveAttempt(optionKey, key === question.correctOption ? 'correct' : 'incorrect');
  }, [isAnswered, question.correctOption, saveAttempt]);

  const resetCode = useCallback(() => {
    setCode(question.codeBlocks[0]?.code || EDITOR_DEFAULT_CODE);
    setLogs([]);
  }, [question.codeBlocks]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-background via-background to-muted/5 px-6 py-4">
        <div className="flex items-center gap-4">
          {prevId ? (
            <Link href={`/questions/${prevId}`}>
              <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full bg-card/50 p-0 hover:bg-muted">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          ) : <div className="w-9" />}
          
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-lg font-semibold tracking-tight text-foreground">
              {question.title}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-2 py-0.5 text-[10px] uppercase tracking-widest opacity-80">
                #{question.id}
              </Badge>
              <Badge variant="outline" className="px-2 py-0.5 text-[10px] uppercase tracking-widest border-border/60">
                {question.difficulty}
              </Badge>
              {question.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-muted/30 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
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
            className="h-9 gap-2 px-4 text-xs font-medium"
          >
            <Bookmark className={`h-4 w-4 ${item.bookmarked ? 'fill-current' : ''}`} />
            {item.bookmarked ? 'Saved' : 'Save'}
          </Button>
          {nextId && (
            <Link href={`/questions/${nextId}`}>
              <Button variant="secondary" size="sm" className="h-9 gap-2 px-4 text-xs font-medium">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* IDE Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: Question & Context */}
        <ResizablePanel defaultSize={40} minSize={25} className="flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'practice' | 'scratchpad')}>
              <TabsList className="mb-4 bg-transparent">
                <TabsTrigger value="practice" className="gap-1.5 text-xs">
                  <Code2 className="h-3 w-3" />
                  Question
                </TabsTrigger>
                <TabsTrigger value="scratchpad" className="gap-1.5 text-xs">
                  <Terminal className="h-3 w-3" />
                  Scratchpad
                </TabsTrigger>
              </TabsList>

              <TabsContent value="practice" className="mt-0 space-y-6">
                <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground/90">
                  <Streamdown>{question.promptMarkdown}</Streamdown>
                </div>

                {question.codeBlocks.length > 0 && (
                  <div className="flex flex-col h-64 rounded-xl border border-border/30 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b border-border/30">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Question Code</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCode(question.codeBlocks[0]?.code || '')}
                        className="h-6 text-[10px]"
                      >
                        Copy to Scratchpad
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <MonacoCodeEditor 
                        value={question.codeBlocks[0]?.code || ''} 
                        onChange={() => {}} 
                        readOnly 
                      />
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card/60 to-background/80 p-6"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Sparkles className="h-20 w-20" />
                      </div>
                      <h3 className="mb-4 font-display text-lg font-medium tracking-tight text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Explanation
                      </h3>
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground/80">
                        <Streamdown>{question.explanationMarkdown}</Streamdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="scratchpad" className="mt-0">
                <div className="flex flex-col h-[calc(100vh-20rem)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">Free Code Editor</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={resetCode} className="h-7 text-xs">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                      <Button size="sm" onClick={runCode} disabled={isRunning} className="h-7 text-xs gap-1.5">
                        <Play className="h-3 w-3" />
                        {isRunning ? 'Running...' : 'Run'}
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 rounded-lg border border-border/30 overflow-hidden">
                    <MonacoCodeEditor value={code} onChange={setCode} onRun={runCode} />
                  </div>
                  <div className="h-36 mt-3">
                    <TerminalOutput logs={logs} isRunning={isRunning} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-px bg-border/60 hover:bg-primary/50 transition-colors" />

        {/* Right: Practice Area */}
        <ResizablePanel defaultSize={60} minSize={35} className="flex flex-col">
          <Card className="h-full overflow-hidden border-border/40 bg-card/30">
            <CardHeader className="border-b border-border/20 bg-muted/5 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {isRecallMode ? 'Active Recall' : 'Select Answer'}
                </CardTitle>
                {!isAnswered && (
                  <button
                    type="button"
                    onClick={() => setIsRecallMode(!isRecallMode)}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/80 hover:text-primary transition-colors"
                  >
                    <Zap className="h-3 w-3" />
                    {isRecallMode ? 'Quiz Mode' : 'Hard Mode'}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {!isRecallMode ? (
                <div className="grid gap-2">
                  {question.options.map((option) => {
                    const disabled = isAnswered;
                    const picked = selected === option.key;
                    const correct = option.key === question.correctOption;

                    let optionStyles = 'border-border/40 bg-black/20 text-foreground/80 hover:bg-muted/30 hover:border-border/80';
                    if (isAnswered) {
                      if (correct) {
                        optionStyles = 'border-success/50 bg-success/10 text-success ring-1 ring-success/30';
                      } else if (picked) {
                        optionStyles = 'border-danger/50 bg-danger/10 text-danger ring-1 ring-danger/30';
                      } else {
                        optionStyles = 'border-border/20 bg-black/10 text-muted-foreground/40 opacity-50';
                      }
                    }

                    return (
                      <button
                        key={option.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleOptionSelect(option.key)}
                        className={`group flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all duration-200 ${optionStyles} ${
                          !disabled ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0' : 'cursor-default'
                        }`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                          picked || (correct && isAnswered)
                            ? 'border-current bg-current/10'
                            : 'border-border/50 bg-black/20 group-hover:border-border'
                        }`}>
                          {option.key}
                        </span>
                        <span className="flex-1 leading-snug">{option.text}</span>
                        {isAnswered && correct && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
                        {isAnswered && picked && !correct && <CircleAlert className="h-4 w-4 shrink-0 text-danger" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={recallAnswer}
                    onChange={(e) => setRecallAnswer(e.target.value)}
                    disabled={isAnswered}
                    placeholder="Type the exact output..."
                    className="w-full min-h-[100px] resize-none rounded-lg border border-border/50 bg-[#0a0a0c] p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  {!isAnswered && (
                    <Button onClick={handleRecallSubmit} className="w-full" size="sm">
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
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                      isCorrect
                        ? 'border-success/30 bg-success/5 text-success'
                        : 'border-danger/30 bg-danger/5 text-danger'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <CircleAlert className="h-4 w-4" />
                      )}
                      <span>
                        {isCorrect ? 'Correct!' : `Answer: ${question.correctOption}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(['hard', 'good', 'easy'] as const).map((grade) => (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => handleSelfGrade(grade)}
                          className={`rounded-lg border p-2 text-center text-xs font-medium uppercase transition-all ${
                            selfGrade === grade
                              ? grade === 'hard'
                                ? 'border-danger/50 bg-danger/20 text-danger'
                                : grade === 'good'
                                  ? 'border-warning/50 bg-warning/20 text-warning'
                                  : 'border-success/50 bg-success/20 text-success'
                              : 'border-border/40 bg-card hover:bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
