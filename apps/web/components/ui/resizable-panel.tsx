'use client';

import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

import { cn } from '@/lib/utils';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  className?: string;
}

function ResizablePanel({ children, defaultSize, minSize, className }: ResizablePanelProps) {
  return (
    <Panel
      defaultSize={defaultSize}
      minSize={minSize}
      className={cn('flex min-h-0 flex-col overflow-hidden', className)}
    >
      {children}
    </Panel>
  );
}

interface ResizablePanelGroupProps {
  children: React.ReactNode;
  direction: 'horizontal' | 'vertical';
  className?: string;
}

function ResizablePanelGroup({ children, direction, className }: ResizablePanelGroupProps) {
  return (
    <PanelGroup
      orientation={direction}
      className={cn('flex h-full min-h-0 w-full flex-1', className)}
    >
      {children}
    </PanelGroup>
  );
}

interface ResizableHandleProps {
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

function ResizableHandle({ direction = 'horizontal', className }: ResizableHandleProps) {
  const isHorizontal = direction === 'horizontal';

  return (
    <PanelResizeHandle
      className={cn(
        'relative flex shrink-0 items-center justify-center',
        'bg-transparent transition-colors hover:bg-primary/50',
        isHorizontal ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
        className,
      )}
    >
      <div className={cn('bg-border/60', isHorizontal ? 'h-8 w-px' : 'w-8 h-px')} />
    </PanelResizeHandle>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
