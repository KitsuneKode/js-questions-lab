import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except:
  // - /robots.txt, /sitemap.xml, /llms-full.txt (SEO & crawl files)
  // - /api/* (API routes)
  // - /_next/* (Next.js internals)
  // - Static assets with extensions (images, fonts, icons, etc.)
  matcher: ['/((?!robots\\.txt|sitemap\\.xml|llms-full\\.txt|api|_next|.*\\..*).*)'],
};
