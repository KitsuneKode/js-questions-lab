import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { isClerkEnabled } from './lib/auth/clerk-key';

const handleI18nRouting = createIntlMiddleware(routing);

const isProtectedRoute = createRouteMatcher(['/:locale/dashboard(.*)']);

/**
 * Guest-first: skip Clerk middleware when the publishable key is missing/placeholder.
 * Otherwise clerkMiddleware rejects invalid keys on every request and breaks local/e2e.
 */
export const proxy = isClerkEnabled()
  ? clerkMiddleware(async (auth, request: NextRequest) => {
      if (isProtectedRoute(request)) {
        await auth.protect();
      }

      return handleI18nRouting(request);
    })
  : (request: NextRequest) => handleI18nRouting(request);

export const config = {
  matcher: [
    // Match all paths except:
    // - Next.js internals and static assets
    // - SEO/crawl files: robots.txt, sitemap.xml, llms-full.txt
    // - Next.js metadata image routes
    '/((?!_next|robots\\.txt|sitemap\\.xml|llms-full\\.txt|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|icon|apple-icon|twitter-image|opengraph-image).*)',
    '/(api|trpc)(.*)',
  ],
};
