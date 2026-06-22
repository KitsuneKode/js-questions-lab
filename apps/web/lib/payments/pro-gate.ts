/**
 * Pro-gate utilities.
 *
 * - useIsPro  — client-side hook (use in Client Components)
 * - requiresPro — server-side helper (use in Server Components / Route Handlers)
 */

// Client hook lives in its own 'use client' module to avoid mixing server
// imports with the 'use client' directive.
export { useIsPro } from './pro-gate.client';

// Server helper is a plain async function; no 'use client' boundary needed.
export { requiresPro } from './pro-gate.server';
