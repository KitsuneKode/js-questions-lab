# SEO & LLM Optimization Guide

The site implements both traditional SEO and modern LLM optimization to maximize discoverability across search engines and AI assistants.

## SEO Infrastructure

- **Robots.txt** (`apps/web/app/robots.ts`): Allows all crawlers, explicitly permits AI crawlers.
- **Sitemap** (`apps/web/app/sitemap.ts`): Dynamic generation including static pages for 6 locales and 156+ questions.
- **Metadata**: Site-wide JSON-LD via `SiteJsonLd` component. Question-level schemas via `QuestionJsonLd` (`FAQPage`, `LearningResource`, `SoftwareSourceCode`, `Quiz`).

## LLM Optimization

- **llms.txt** (`/llms.txt`): Static file following the emerging convention for AI systems.
- **Full Content Dump** (`apps/web/app/llms-full.txt/route.ts`): Plain text endpoint with all questions in Markdown format.
- **Questions API** (`apps/web/app/api/questions/route.ts`): JSON API for programmatic access (CORS enabled).

## Centralized Utilities

Use `getBaseUrl()`, `getCanonicalUrl(locale, path)`, and `buildHreflangAlternates(path)` from `apps/web/lib/seo/config.ts` for all SEO URL generation.
