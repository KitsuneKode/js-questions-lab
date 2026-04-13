'use client';

import type { ReactNode } from 'react';
import { createContext, createElement, useContext } from 'react';

export interface SafeAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
}

export function isValidClerkKey(key?: string): boolean {
  if (!key) return false;
  return (
    key.startsWith('pk_') && !key.includes('REPLACE') && !key.toLowerCase().includes('placeholder')
  );
}

export const clerkEnabled = isValidClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Fail fast on the server if the publishable key is valid but the secret key is missing or is a placeholder.
// This prevents Next.js SSR and 'next build' from breaking mysteriously with "Missing secretKey"
if (clerkEnabled && typeof window === 'undefined') {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret || secret.includes('REPLACE') || secret.toLowerCase().includes('placeholder')) {
    throw new Error(
      `[Auth Configuration Error] clerkEnabled is true because NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is valid, ` +
        `but CLERK_SECRET_KEY is missing or invalid on the server. ` +
        `Either provide a valid CLERK_SECRET_KEY or use a placeholder for NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to disable Clerk entirely.`,
    );
  }
}

export const guestAuth: SafeAuthState = { isLoaded: true, isSignedIn: false, userId: null };

const SafeAuthContext = createContext<SafeAuthState>(guestAuth);

interface SafeAuthProviderProps {
  value: SafeAuthState;
  children: ReactNode;
}

export function SafeAuthProvider({ value, children }: SafeAuthProviderProps) {
  return createElement(SafeAuthContext.Provider, { value }, children);
}

/**
 * Reads auth state from the local auth bridge so guest mode can work without
 * conditionally calling Clerk hooks.
 */
export function useSafeAuth() {
  return useContext(SafeAuthContext);
}
