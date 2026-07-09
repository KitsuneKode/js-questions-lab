'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import {
  clearScratchpadCode,
  readScratchpadCode,
  writeScratchpadCode,
} from '@/lib/scratchpad/storage';

interface ScratchpadContextValue {
  isOpen: boolean;
  hasOpened: boolean;
  code: string;
  openScratchpad: (initialCode?: string, method?: 'replace' | 'append') => void;
  closeScratchpad: () => void;
  setCode: (code: string) => void;
  resetCode: () => void;
}

const ScratchpadContext = createContext<ScratchpadContextValue | null>(null);

export function useScratchpad() {
  const ctx = useContext(ScratchpadContext);
  if (!ctx) {
    throw new Error('useScratchpad must be used within a ScratchpadProvider');
  }
  return ctx;
}

export function ScratchpadProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [code, setCodeState] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCodeState(readScratchpadCode());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeScratchpadCode(code);
  }, [code, hydrated]);

  const setCode = useCallback((next: string) => {
    setCodeState(next);
  }, []);

  const resetCode = useCallback(() => {
    setCodeState('');
    clearScratchpadCode();
  }, []);

  const openScratchpad = useCallback(
    (initialCode?: string, method: 'replace' | 'append' = 'replace') => {
      if (initialCode !== undefined) {
        setCodeState((prev) => (method === 'append' ? `${prev}\n\n${initialCode}` : initialCode));
      }
      setHasOpened(true);
      setIsOpen(true);
    },
    [],
  );

  const closeScratchpad = useCallback(() => setIsOpen(false), []);

  return (
    <ScratchpadContext.Provider
      value={{
        isOpen,
        hasOpened,
        code,
        openScratchpad,
        closeScratchpad,
        setCode,
        resetCode,
      }}
    >
      {children}
    </ScratchpadContext.Provider>
  );
}
