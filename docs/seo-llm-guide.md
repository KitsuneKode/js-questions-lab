# SEO & LLM Optimization Guide

This document describes the SEO and LLM accessibility implementation for JS Questions Lab.

## Overview

The site implements both traditional SEO and modern LLM optimization to maximize discoverability across search engines and AI assistants.

## SEO Infrastructure

### Robots.txt (`/robots.txt`)

**File**: `apps/web/app/robots.ts`

- Allows all crawlers on `/`
- Disallows `/api/` and `/_next/` paths
- Explicitly permits AI crawlers (GPTBot, Claude-Web, PerplexityBot, Anthropic-AI, etc.)
- References sitemap location

### Sitemap (`/sitemap.xml`)

**File**: `apps/web/app/sitemap.ts`

Dynamic sitemap generation including:

- Static pages for all 6 locales (landing, questions list, dashboard, credits)
- All 156+ questions across all locales (~1000+ URLs)
- Appropriate `changeFrequency` and `priority` values

### Metadata

#### Root Layout (`apps/web/app/layout.tsx`)

- 17+ targeted keywords for JavaScript interview prep
- AI-specific meta hints (`ai-content-declaration: educational`, `content-license: MIT`)
- Category set to `education`

#### Locale Layout (`apps/web/app/[locale]/layout.tsx`)

- Localized titles and descriptions via `next-intl`
- `alternates.canonical` for current locale
- `alternates.languages` with all 6 locales + `x-default`
- Site-wide JSON-LD via `SiteJsonLd` component

#### Page-Level Metadata

| Page            | File                                   | Features                                                   |
| --------------- | -------------------------------------- | ---------------------------------------------------------- |
| Landing         | `app/[locale]/page.tsx`                | Canonical URL, localized meta                              |
| Questions List  | `app/[locale]/questions/page.tsx`      | Canonical URL, localized meta                              |
| Question Detail | `app/[locale]/questions/[id]/page.tsx` | Dynamic title, hreflang, OG article type, QuestionJsonLd   |

## JSON-LD Structured Data

### Site-Wide Schemas (`SiteJsonLd`)

**File**: `apps/web/components/seo/site-json-ld.tsx`

Included in locale layout, renders:

1. **WebSite** - Site identity with SearchAction for sitelinks search box
2. **EducationalOrganization** - Platform as educational entity
3. **Course** - Overall learning experience metadata

### Question-Level Schemas (`QuestionJsonLd`)

**File**: `apps/web/components/seo/question-json-ld.tsx`

Included in question detail pages, renders:

1. **FAQPage** - Question/Answer for rich results
2. **LearningResource** - Educational content with difficulty, tags
3. **SoftwareSourceCode** - Code snippet metadata
4. **Quiz** - Multiple choice assessment format

### Security: XSS Prevention

All JSON-LD uses the `safeJsonLd()` helper that escapes `<` characters to prevent script injection:

```typescript
function safeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
```

This follows the official Next.js recommendation: <https://nextjs.org/docs/app/guides/json-ld>

## LLM Optimization

### llms.txt (`/llms.txt`)

**File**: `apps/web/public/llms.txt`

Static file following the emerging `llms.txt` convention:

- Site description and purpose
- Available content endpoints
- Attribution to Lydia Hallie (original content) and KitsuneKode (platform)
- Usage guidelines for AI systems

### Full Content Dump (`/llms-full.txt`)

**File**: `apps/web/app/llms-full.txt/route.ts`

Plain text endpoint with all questions in Markdown format:

- Question ID, title, tags, difficulty
- Code snippets
- Options and correct answer
- Full explanations
- Cached for 24 hours

### Questions API (`/api/questions`)

**File**: `apps/web/app/api/questions/route.ts`

JSON API for programmatic access:

- Metadata (total count, source, timestamp)
- All questions with full data
- CORS headers for cross-origin access
- Cached for 1 hour

### Single Question API (`/api/questions/[id]`)

**File**: `apps/web/app/api/questions/[id]/route.ts`

Individual question lookup:

- Full question data
- Canonical URL
- 400/404 error handling

## Centralized SEO Utilities

**File**: `apps/web/lib/seo/config.ts`

- `getBaseUrl()` - Returns production URL with fallback
- `getCanonicalUrl(locale, path)` - Builds canonical URLs
- `buildHreflangAlternates(path)` - Generates alternates for all locales

## Site Configuration

**File**: `apps/web/lib/site-config.ts`

Contains:

- `url` - Production site URL
- `license` - Content license (MIT)
- `source` - Attribution to Lydia Hallie
- Creator and contact information

## Validation

### Tools

- [Google Rich Results Test](https://search.google.com/test/rich-results) - Validate FAQ schema
- [Schema Markup Validator](https://validator.schema.org/) - Generic schema validation
- Lighthouse SEO audit

### Checklist

- [ ] `bun run build` succeeds
- [ ] `/robots.txt` accessible
- [ ] `/sitemap.xml` lists all pages
- [ ] `/llms.txt` accessible
- [ ] `/llms-full.txt` returns plain text
- [ ] `/api/questions` returns valid JSON
- [ ] View source shows JSON-LD in `<head>`
- [ ] Rich Results Test passes for question pages

## i18n SEO

The implementation supports 6 locales with proper SEO:

| Locale              | Code    |
| ------------------- | ------- |
| English             | `en`    |
| Spanish             | `es`    |
| French              | `fr`    |
| German              | `de`    |
| Japanese            | `ja`    |
| Portuguese (Brazil) | `pt-BR` |

Each locale has:

- Canonical URLs
- Hreflang alternate links
- `x-default` pointing to English

## Future Enhancements

1. **Dynamic OG Images** - Use `@vercel/og` for per-question social cards
2. **Breadcrumb Schema** - Add navigation hierarchy
3. **More Languages** - Expand hreflang as translations are added
4. **Analytics** - Track SEO performance via Search Console
