'use client';

import dynamic from 'next/dynamic';

import { useScratchpad } from './scratchpad-context';

const FloatingScratchpad = dynamic(
  () => import('./floating-scratchpad').then((mod) => mod.FloatingScratchpad),
  { ssr: false },
);

export function FloatingScratchpadGate() {
  const { hasOpened } = useScratchpad();

  if (!hasOpened) {
    return null;
  }

  return <FloatingScratchpad />;
}
