'use client';

import { IconKeyboard, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
    context?: 'global' | 'questions' | 'question-detail';
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Quick search questions', context: 'global' },
      { keys: ['?'], description: 'Show keyboard shortcuts', context: 'global' },
    ],
  },
  {
    title: 'Questions List',
    shortcuts: [
      { keys: ['J', '↓'], description: 'Next question', context: 'questions' },
      { keys: ['K', '↑'], description: 'Previous question', context: 'questions' },
      { keys: ['O', 'Enter'], description: 'Open selected question', context: 'questions' },
    ],
  },
  {
    title: 'Question Detail',
    shortcuts: [
      { keys: ['A', 'B', 'C', 'D'], description: 'Select answer option', context: 'question-detail' },
      { keys: ['R'], description: 'Reveal/Hide explanation', context: 'question-detail' },
      { keys: ['⌘', 'Enter'], description: 'Run code', context: 'question-detail' },
      { keys: ['S'], description: 'Open scratchpad', context: 'question-detail' },
      { keys: ['J'], description: 'Previous question', context: 'question-detail' },
      { keys: ['K'], description: 'Next question', context: 'question-detail' },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const [isOpen, setIsOpen] = useState(open ?? false);

  // Sync with external open state if provided
  useEffect(() => {
    if (onOpenChange) {
      setIsOpen(open ?? false);
    }
  }, [open, onOpenChange]);

  // Listen for ? key to toggle shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '?' && !e.shiftKey) {
        e.preventDefault();
        if (onOpenChange) {
          onOpenChange(!isOpen);
        } else {
          setIsOpen((prev) => !prev);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onOpenChange]);

  const controlled = onOpenChange !== undefined;
  const modalOpen = controlled ? open : isOpen;
  const setModalOpen = onOpenChange ?? setIsOpen;

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <IconKeyboard className="h-5 w-5 text-primary" />
              Keyboard Shortcuts
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="h-8 w-8 p-0"
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface/50 hover:bg-surface transition-colors"
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className={cn(
                            'inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-md border border-border-subtle bg-elevated text-xs font-medium text-foreground shadow-sm',
                            key.length === 1 && 'font-mono',
                          )}
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-border-subtle">
            <p className="text-xs text-muted-foreground text-center">
              Press{' '}
              <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded border border-border-subtle bg-muted/50 text-[10px] font-mono">
                ?
              </kbd>{' '}
              anytime to toggle this help dialog
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper hook for opening shortcuts from anywhere
export function useKeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  const KeyboardShortcutsTrigger = () => (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-2 text-xs font-medium border-border-subtle hover:border-primary/40 transition-all active:scale-[0.95]"
        title="Keyboard shortcuts (?)"
      >
        <IconKeyboard className="h-4 w-4" />
        <span className="hidden sm:inline">Shortcuts</span>
        <kbd className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded border border-border-subtle bg-muted/50 text-[9px] font-mono">
          ?
        </kbd>
      </Button>
      <KeyboardShortcutsModal open={open} onOpenChange={setOpen} />
    </>
  );

  return { KeyboardShortcutsTrigger, open, setOpen };
}
