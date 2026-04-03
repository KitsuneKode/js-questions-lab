# Question Discovery And Progress Architecture

This note captures the implementation decisions for the question library, filter URL model, and local progress mechanics.

## Filters And URL State

- Question discovery state lives in the URL so links are shareable, reload-safe, and compatible with static generation.
- Multi-select filters use repeated query params, for example `?tags=scope&tags=async&difficulties=beginner`.
- Server-compatible filtering logic lives in `apps/web/lib/content/query.ts`.
- The questions page keeps filtering client-side for URL responsiveness, but the data passed into the client is a lightweight discovery index rather than the full question corpus.

## Scoped Navigation

- Prev/next navigation and keyboard shortcuts should stay aware of the active filtered subset.
- Query params are preserved across question detail navigation so users can move within the same scoped practice session.
- Client-only search-param consumers should remain behind Suspense or explicit client-only boundaries to avoid breaking static generation.

## Progress Model

- Core practice works without auth and stores progress locally first.
- Section progress is topic-based and persists in local storage.
- SRS data is stored per question and drives review recommendations when available.
- Authenticated sync should augment this model, not replace the guest-first local behavior.

## Content Identity

- The English corpus is the authoritative ID set for static question generation.
- Localized content should map onto the same IDs; do not introduce locale-exclusive IDs without revisiting `generateStaticParams`, SEO, and API assumptions.
