# SEO Fixes Implementation Plan

**Generated**: April 2, 2026  
**Audit Score**: 72/100 → 90+/100 (Target)

> Verified against Next.js 16 App Router docs via Context7 MCP.

---

## Priority Matrix

- P0: Fix metadataBase fallback — ✅ Done
- P0: Remove dashboard from sitemap — ✅ Done
- P0: Add noindex to auth pages — ✅ Done
- P1: Apple touch icon — ✅ Done
- P1: Breadcrumb navigation — ✅ Done
- P1: Localized OG images — ✅ Done
- P2: Full metadata on dashboard/credits — ✅ Done
- P2: Update llms.txt date — ✅ Done
- P2: Related topics component — ✅ Done

---

## Implementation Checklist

### Phase 1: Critical

- [x] Fix metadataBase fallback in `layout.tsx`
- [x] Remove dashboard from sitemap
- [x] Add noindex to auth pages

### Phase 2: High Priority

- [x] Create `apple-icon.tsx`
- [x] Create breadcrumb JSON-LD + UI
- [x] Add breadcrumbs to question detail page
- [x] Create locale-specific OG images

### Phase 3: Optimization

- [x] Add full metadata to dashboard page
- [x] Add full metadata to credits page
- [x] Update llms.txt date to 2026
- [x] Add related topics component

---

## Verification (Context7 MCP)

- Viewport meta: ✅ Auto-handled by Next.js 16
- JSON-LD XSS: ✅ Already implemented
- Sitemap URLs: ✅ Already correct
- Hreflang: ✅ Already implemented

---

## Next Steps

1. Run `bun run typecheck && bun run build`
2. Deploy to staging
3. Test with Google Rich Results Test

---

**Last Updated**: April 2, 2026  
**Status**: Complete
