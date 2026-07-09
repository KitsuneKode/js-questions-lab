import type { NextRequest } from 'next/server';

/** API/trpc must not go through next-intl localePrefix redirects. */
export function isApiOrTrpcPath(pathname: string) {
  return pathname.startsWith('/api') || pathname.startsWith('/trpc');
}

export function isApiOrTrpcRequest(request: NextRequest) {
  return isApiOrTrpcPath(request.nextUrl.pathname);
}
