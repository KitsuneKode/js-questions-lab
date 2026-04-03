# Learning Product Roadmap

This project is evolving from a static question library into a full interview-practice platform. The core product direction is stable even if individual experiments change.

## Product Principles

- Active recall beats passive recognition. The experience should push users to predict output, commit to an answer, and self-correct.
- Guest-first access stays intact. Browsing and practice should work without auth; identity exists for sync, saved work, and longer-term learning loops.
- Progress should become more structured over time. Random browsing is useful, but the long-term goal is guided paths, due reviews, and habit-forming repetition.

## Current State

- Static question content, localized pages, and local-first progress are already live.
- SRS primitives exist in `apps/web/lib/progress/srs.ts` and the dashboard review queue logic already uses them.
- Auth and Supabase sync are implemented as an optional persistence layer, not a gate for basic study.
- The Visual Debugger is shipped and should be treated as the primary execution-visualization foundation.

## Near-Term Priorities

- Strengthen active-recall modes such as stricter output prediction and self-grading flows.
- Add more deliberate practice structures such as playlists, paths, and daily review surfaces.
- Keep improving the authenticated dashboard around sync status, saved artifacts, and review management instead of duplicating the guest progress page.
- Expand the content pipeline carefully if additional sources are added; preserve normalized IDs and generated JSON as the app contract.

## Constraints To Preserve

- Do not make auth mandatory for core learning flows.
- Do not regress the static-first architecture for public content pages.
- Do not treat the current Lydia corpus as future-proof coverage; the source snapshot reflects JavaScript concepts as documented in 2019.
