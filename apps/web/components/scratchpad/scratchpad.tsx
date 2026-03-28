'use client';

import { useState, useCallback } from 'react';
import { Play, RotateCcw, FileCode, Sparkles } from 'lucide-react';
import { MonacoCodeEditor } from '@/components/editor/monaco-code-editor';
import { TerminalOutput } from '@/components/terminal/terminal-output';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { QuestionRecord } from '@/lib/content/types';
import { runJavaScriptInSandbox } from '@/lib/run/sandbox';
import type { TerminalLogEntry } from '@/lib/run/terminal';
import { toTerminalLogEntries } from '@/lib/run/terminal';

interface ScratchpadProps {
  question?: QuestionRecord;
  initialCode?: string;
}

const DEFAULT_CODE = `// Welcome to the Scratchpad! 🎉
// Write any JavaScript code and run it here.
// Try experimenting with JavaScript concepts.

function greet(name) {
  return \`Hello, \${name}! Welcome to JavaScript practice.\`;
}

console.log(greet('Developer'));

// Let's try some array manipulation
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

// And async operations
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('Starting async operation...');
  await delay(500);
  console.log('Async operation complete!');
})();
`;

export function Scratchpad({ question, initialCode }: ScratchpadProps) {
  const [code, setCode] = useState(initialCode || DEFAULT_CODE);
  const [logs, setLogs] = useState<TerminalLogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = useCallback(async () => {
    if (!code.trim()) return;
    
    setIsRunning(true);
    setLogs([]);

    try {
      const result = await runJavaScriptInSandbox(code);
      setLogs(toTerminalLogEntries(result));
    } catch (error) {
      setLogs([
        {
          type: 'error',
          content: String(error),
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  }, [code]);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_CODE);
    setLogs([]);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border/40 bg-card/20">
      <Tabs defaultValue="scratchpad" className="flex h-full flex-col">
        {/* Tab Bar */}
        <div className="flex items-center justify-between border-b border-border/40 bg-muted/10 px-4 py-2">
          <TabsList className="bg-transparent">
            <TabsTrigger
              value="question"
              className="flex items-center gap-1.5 text-xs"
            >
              <FileCode className="h-3 w-3" />
              Question
            </TabsTrigger>
            <TabsTrigger
              value="scratchpad"
              className="flex items-center gap-1.5 text-xs"
            >
              <Sparkles className="h-3 w-3" />
              Scratchpad
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={runCode}
              disabled={isRunning}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <Play className="h-3.5 w-3.5" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <TabsContent value="question" className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden">
              <MonacoCodeEditor
                value={question?.codeBlocks[0]?.code || ''}
                onChange={() => {}}
                onRun={runCode}
                readOnly
              />
            </div>
            <div className="h-40 border-t border-border/40">
              <TerminalOutput logs={logs} isRunning={isRunning} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scratchpad" className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <MonacoCodeEditor
                value={code}
                onChange={setCode}
                onRun={runCode}
              />
            </div>

            {/* Terminal Output */}
            <div className="h-48 border-t border-border/40">
              <TerminalOutput logs={logs} isRunning={isRunning} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
