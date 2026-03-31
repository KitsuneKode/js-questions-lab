'use client';

import { createContext, useContext, useState } from 'react';

interface FilterPendingContextValue {
  isPending: boolean;
  setIsPending: (v: boolean) => void;
}

const FilterPendingContext = createContext<FilterPendingContextValue>({
  isPending: false,
  setIsPending: () => {},
});

export function FilterPendingProvider({ children }: { children: React.ReactNode }) {
  const [isPending, setIsPending] = useState(false);
  return (
    <FilterPendingContext.Provider value={{ isPending, setIsPending }}>
      {children}
    </FilterPendingContext.Provider>
  );
}

export function useFilterPending() {
  return useContext(FilterPendingContext);
}
