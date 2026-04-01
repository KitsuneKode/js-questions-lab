'use client';

import { IconKeyboard, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ShortcutGroup {
  title: string;
  scope: 'global' | 'list' | 'detail';
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global (Works Everywhere)',
    scope: 'global',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Quick search questions' },
      { keys: ['?'], description: 'Show keyboard shortcuts help' },
      { keys: ['K'], description: 'Open scratchpad' },
    ],
  },
  {
    title: 'Questions List Page',
    scope: 'list',
    shortcuts: [
      { keys: ['J', '↓'], description: 'Next question in list' },
      { keys: ['K', '↑'], description: 'Previous question in list' },
      { keys: ['O', 'Enter'], description: 'Open selected question' },
    ],
  },
  {
    title: 'Question Detail Page',
    scope: 'detail',
    shortcuts: [
      { keys: ['A', 'B', 'C', 'D'], description: 'Select answer option' },
      { keys: ['1', '2', '3', '4'], description: 'Select answer option (alternative)' },
      { keys: ['Space'], description: 'Reveal/Hide explanation' },
      { keys: ['R'], description: 'Run code' },
      { keys: ['←'], description: 'Previous question' },
      { keys: ['→'], description: 'Next question' },
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

      // ? is Shift+/ so we need to check for both
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
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
          <DialogDescription>
            Quick reference for the global, question list, and question detail keyboard controls.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {group.title}
                </h3>
                {group.scope === 'global' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    Works everywhere
                  </span>
                )}
                {group.scope === 'list' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">
                    Questions list only
                  </span>
                )}
                {group.scope === 'detail' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface/40 text-tertiary font-medium border border-border/50">
                    Question detail only
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface/50 hover:bg-surface transition-colors"
                  >
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
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
