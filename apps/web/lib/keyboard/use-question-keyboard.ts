'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

type OptionKey = 'A' | 'B' | 'C' | 'D';

interface UseQuestionKeyboardOptions {
  isAnswered: boolean;
  options: { key: string }[];
  prevHref: string | null;
  nextHref: string | null;
  onSelectOption: (key: string) => void;
  onRevealToggle?: () => void;
  onRunCode?: () => void;
  onOpenSearch?: () => void;
}

const OPTION_KEYS: Record<string, OptionKey> = {
  a: 'A',
  '1': 'A',
  b: 'B',
  '2': 'B',
  c: 'C',
  '3': 'C',
  d: 'D',
  '4': 'D',
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  // Monaco mounts inside a div with data-monaco-editor-root; also reject textareas, inputs
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    target.isContentEditable ||
    !!target.closest('[data-monaco-editor-root]') ||
    !!target.closest('.monaco-editor')
  );
}

export function useQuestionKeyboard({
  isAnswered,
  options,
  prevHref,
  nextHref,
  onSelectOption,
  onRevealToggle,
  onRunCode,
  onOpenSearch,
}: UseQuestionKeyboardOptions) {
  const router = useRouter();

  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Never fire on modifier combos (Ctrl+R, Cmd+K, etc.) — EXCEPT Ctrl+K for search
      if (e.altKey) return;
      if (isEditableTarget(e.target)) return;

      // Ctrl+K → open search dialog (always available)
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && onOpenSearch) {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      // Block other modifier combos
      if (e.ctrlKey || e.metaKey) return;

      const key = e.key.toLowerCase();

      // 1-4 or a-d → select option (only before answering)
      if (!isAnswered && key in OPTION_KEYS) {
        const optionKey = OPTION_KEYS[key];
        const exists = options.some((o) => o.key === optionKey);
        if (exists) {
          e.preventDefault();
          onSelectOption(optionKey);
        }
        return;
      }

      // Arrow navigation - always available
      if (e.key === 'ArrowLeft' && prevHref) {
        e.preventDefault();
        router.push(prevHref);
        return;
      }

      // Forward navigation - always available
      if (e.key === 'ArrowRight' && nextHref) {
        e.preventDefault();
        router.push(nextHref);
        return;
      }

      // Space → reveal/toggle explanation
      if (e.key === ' ' && onRevealToggle) {
        e.preventDefault();
        onRevealToggle();
        return;
      }

      // r → run code
      if (key === 'r' && onRunCode) {
        e.preventDefault();
        onRunCode();
        return;
      }
    },
    [
      isAnswered,
      options,
      prevHref,
      nextHref,
      onSelectOption,
      onRevealToggle,
      onRunCode,
      onOpenSearch,
      router,
    ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
