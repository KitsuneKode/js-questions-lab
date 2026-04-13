'use client';

import type { ReactNode } from 'react';
import { createContext, createElement, useContext } from 'react';

export interface SafeAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
}

export const clerkEnabled =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_') &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('REPLACE') &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder') &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 20;

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
