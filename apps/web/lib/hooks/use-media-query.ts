'use client';

import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query. Defaults to `false` during SSR / first paint
 * so server and client markup stay aligned until hydration.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function useIsMdUp(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
