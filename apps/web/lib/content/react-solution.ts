'use server';

import { getReactSolution } from '@/lib/content/react-loaders';

/** Server-only: returns solution files after the learner reveals the answer. */
export async function fetchReactSolution(id: string): Promise<Record<string, string> | null> {
  return getReactSolution(id);
}
