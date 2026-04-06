'use client';

import { useSandpack } from '@codesandbox/sandpack-react';
import { cn } from '@/lib/utils';

interface SandpackFileTabsProps {
  solutionViewed: boolean;
}

export function SandpackFileTabs({ solutionViewed }: SandpackFileTabsProps) {
  const { sandpack } = useSandpack();
  const files = Object.keys(sandpack.files).filter((path) => !path.includes('/node_modules/'));

  return (
    <div className="flex items-center overflow-x-auto border-b border-border/60 bg-surface/70">
      {files.map((filePath) => {
        const isActive = sandpack.activeFile === filePath;
        const fileName = filePath.replace(/^\//, '');
        return (
          <button
            key={filePath}
            type="button"
            onClick={() => sandpack.setActiveFile(filePath)}
            className={cn(
              'shrink-0 border-r border-border/40 px-4 py-2 font-mono text-xs transition-colors',
              isActive
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:bg-elevated hover:text-foreground',
            )}
          >
            {fileName}
          </button>
        );
      })}
      {solutionViewed && (
        <span className="ml-auto shrink-0 border-l border-border/40 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
          Solution
        </span>
      )}
    </div>
  );
}
