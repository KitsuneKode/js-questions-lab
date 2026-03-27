'use client';

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable-panel';
import { Scratchpad } from '@/components/scratchpad/scratchpad';
import type { QuestionRecord } from '@/lib/content/types';

interface QuestionIDEProps {
  question: QuestionRecord;
}

export function QuestionIDE({ question }: QuestionIDEProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full"
    >
      {/* Left: Question Context */}
      <ResizablePanel
        defaultSize={45}
        minSize={30}
        className="flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-auto p-6">
          <div className="markdown">
            <h2 className="text-xl font-semibold">{question.title}</h2>
            <div className="mt-2 text-muted-foreground">
              {question.promptMarkdown}
            </div>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle className="w-px bg-border hover:bg-primary/50 transition-colors" />

      {/* Right: Editor + Console */}
      <ResizablePanel
        defaultSize={55}
        minSize={40}
        className="flex flex-col overflow-hidden"
      >
        <div className="h-full overflow-hidden">
          <Scratchpad question={question} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
