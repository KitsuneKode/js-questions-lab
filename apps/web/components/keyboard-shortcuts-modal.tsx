'use client';

import { IconKeyboard, IconX } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
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

type ShortcutTitleKey = 'global' | 'list' | 'detail';
type ShortcutDescriptionKey =
  | 'desc_search'
  | 'desc_help'
  | 'desc_scratchpad'
  | 'desc_nextList'
  | 'desc_prevList'
  | 'desc_openList'
  | 'desc_selectOption'
  | 'desc_selectOptionAlt'
  | 'desc_toggleExp'
  | 'desc_runCode'
  | 'desc_prevDet'
  | 'desc_nextDet';

interface ShortcutGroup {
  titleKey: ShortcutTitleKey;
  scope: 'global' | 'list' | 'detail';
  shortcuts: {
    keys: string[];
    descriptionKey: ShortcutDescriptionKey;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    titleKey: 'global',
    scope: 'global',
    shortcuts: [
      { keys: ['⌘', 'K'], descriptionKey: 'desc_search' },
      { keys: ['?'], descriptionKey: 'desc_help' },
      { keys: ['K'], descriptionKey: 'desc_scratchpad' },
    ],
  },
  {
    titleKey: 'list',
    scope: 'list',
    shortcuts: [
      { keys: ['J', '↓'], descriptionKey: 'desc_nextList' },
      { keys: ['K', '↑'], descriptionKey: 'desc_prevList' },
      { keys: ['O', 'Enter'], descriptionKey: 'desc_openList' },
    ],
  },
  {
    titleKey: 'detail',
    scope: 'detail',
    shortcuts: [
      { keys: ['A', 'B', 'C', 'D'], descriptionKey: 'desc_selectOption' },
      { keys: ['1', '2', '3', '4'], descriptionKey: 'desc_selectOptionAlt' },
      { keys: ['Space'], descriptionKey: 'desc_toggleExp' },
      { keys: ['R'], descriptionKey: 'desc_runCode' },
      { keys: ['←'], descriptionKey: 'desc_prevDet' },
      { keys: ['→'], descriptionKey: 'desc_nextDet' },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const [isOpen, setIsOpen] = useState(open ?? false);
  const t = useTranslations('shortcuts');

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
              {t('title')}
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
          <DialogDescription>{t('desc')}</DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.titleKey}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t(group.titleKey)}
                </h3>
                {group.scope === 'global' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    {t('globalTag')}
                  </span>
                )}
                {group.scope === 'list' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">
                    {t('listTag')}
                  </span>
                )}
                {group.scope === 'detail' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface/40 text-tertiary font-medium border border-border/50">
                    {t('detailTag')}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.descriptionKey}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface/50 hover:bg-surface transition-colors"
                  >
                    <span className="text-sm text-foreground">{t(shortcut.descriptionKey)}</span>
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
              {t.rich('toggleHint', {
                key: (chunks) => (
                  <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded border border-border-subtle bg-muted/50 text-[10px] font-mono">
                    {chunks}
                  </kbd>
                ),
              })}
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
  const tNav = useTranslations('nav');

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
        <span className="hidden sm:inline">{tNav('shortcuts')}</span>
        <kbd className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded border border-border-subtle bg-muted/50 text-[9px] font-mono">
          ?
        </kbd>
      </Button>
      <KeyboardShortcutsModal open={open} onOpenChange={setOpen} />
    </>
  );

  return { KeyboardShortcutsTrigger, open, setOpen };
}
