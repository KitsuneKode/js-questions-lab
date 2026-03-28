'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ScratchpadContextValue {
  isOpen: boolean;
  hasOpened: boolean;
  code: string;
  openScratchpad: (initialCode?: string, method?: 'replace' | 'append') => void;
  closeScratchpad: () => void;
  setCode: (code: string) => void;
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
  const [code, setCode] = useState('');

  const openScratchpad = useCallback((initialCode?: string, method: 'replace' | 'append' = 'replace') => {
    if (initialCode !== undefined) {
      setCode((prev) => (method === 'append' ? prev + '\n\n' + initialCode : initialCode));
    }
    setHasOpened(true);
    setIsOpen(true);
  }, []);

  const closeScratchpad = useCallback(() => setIsOpen(false), []);

  return (
    <ScratchpadContext.Provider value={{ isOpen, hasOpened, code, openScratchpad, closeScratchpad, setCode }}>
      {children}
    </ScratchpadContext.Provider>
  );
}
