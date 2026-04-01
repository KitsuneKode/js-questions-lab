'use client';

import { createContext, useContext, useMemo, useTransition } from 'react';

interface FilterPendingContextValue {
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}

const FilterPendingContext = createContext<FilterPendingContextValue>({
  isPending: false,
  startTransition: (fn) => fn(),
});

export function FilterPendingProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const value = useMemo(() => ({ isPending, startTransition }), [isPending]);
  return <FilterPendingContext.Provider value={value}>{children}</FilterPendingContext.Provider>;
}

export function useFilterPending() {
  return useContext(FilterPendingContext);
}
