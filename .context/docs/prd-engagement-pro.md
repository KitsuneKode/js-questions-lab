# PRD: Engagement Engine & Pro Tier
**Status**: Draft v1.0  
**Date**: 2026-04-04  
**Author**: Product (via grill-me session)  
**Branch target**: `feat/engagement-pro`

---

## 1. Executive Summary

This PRD introduces the full retention engine and SaaS monetization layer for the platform. The goal is to transform the current static JS practice tool into a habit-forming, socially competitive, AI-assisted learning product that justifies a $9/month Pro subscription targeted at global developers.

The core insight: **logged-in must feel dramatically better than guest.** The leaderboard is the sign-up funnel. AI features are the upgrade funnel.

---

## 2. Problem Statement

### Current state
- The dashboard shows useful stats (accuracy, SRS queue, topic radar) but has no return driver.
- There is no reason to create an account beyond progress sync.
- There is no competitive element, no social proof, and no premium ceiling.
- Guest and logged-in experiences are functionally identical in perceived value.

### What we need
- A daily hook that makes users feel a loss if they skip (streak).
- A competitive surface that makes users want to be seen (leaderboard).
- A clear, meaningful upgrade path (Pro AI features).
- A sense of progression beyond "answered questions" (XP, mastery levels).

---

## 3. Goals & Success Metrics

| Goal | Metric | Target (90 days post-launch) |
|---|---|---|
| Drive sign-ups | Conversion: guest → logged-in | >15% of active guests |
| Daily retention | DAU/MAU ratio | >30% |
| Streak engagement | Users with 7+ day streak | >20% of logged-in users |
| Pro conversion | Free → Pro | >5% of logged-in users |
| AI Interview usage | Sessions per Pro user/month | >3 |
| Leaderboard stickiness | Users checking leaderboard weekly | >40% of logged-in |

---

## 4. User Personas

### The Grinder (primary)
Junior/mid developer actively job hunting. Practices daily. Competitive. Wants proof of progress to show recruiters. Will pay for AI interview prep.

### The Drifter (secondary)
Developer who browses occasionally. Needs the streak hook to build a habit. Leaderboard peer pressure converts them into a Grinder.

### The Expert (tertiary)
Senior dev testing themselves. Won't pay for basics. Will pay for AI interview simulation as interview coaching. Dominant on the all-time leaderboard — creates aspiration for others.

---

## 5. Feature Specifications

---

### 5.1 XP & Anti-Abuse Scoring System

**Purpose**: Replace raw "questions answered" with a fair, gamified score that rewards quality over quantity.

#### XP Earn Table

| Event | XP Delta | Notes |
|---|---|---|
| Correct answer — easy | +10 | |
| Correct answer — medium | +20 | |
| Correct answer — hard | +35 | |
| Wrong answer (any difficulty) | −5 | Discourages random guessing |
| First-attempt correct (no prior wrong on this question today) | +10 bonus | Precision bonus |
| Daily streak maintained | +15 | Applied on first answer of the day |
| Full SRS review queue cleared | +25 | Rewards discipline |
| Re-answering mastered question | +2 (capped) | Diminishing return: prevents grind on easy questions |
| Repeat same question within 10-minute cooldown | 0 | No gain, no loss — cooldown kills spam abuse |

#### Anti-Abuse Rules
- **Cooldown**: Same question → same user: 0 XP within 10 minutes of last attempt.
- **Mastery cap**: Questions with SRS `repetition >= 4` yield max +2 XP regardless of difficulty.
- **Daily floor**: XP cannot go below 0 for the day (negative carry-over blocked).
- **Weekly XP**: Computed fresh each Monday 00:00 UTC from XP transaction log — no manual overrides.

#### XP Levels (visible on profile)
| Level | Name | XP Required |
|---|---|---|
| 1 | Apprentice | 0 |
| 2 | Practitioner | 500 |
| 3 | Engineer | 1,500 |
| 4 | Architect | 4,000 |
| 5 | Principal | 10,000 |
| 6 | Distinguished | 25,000 |

Level names are domain-relevant (engineering career ladder). Not gamey titles.

---

### 5.2 Streak System

**Purpose**: Drive daily return behaviour through loss aversion.

- **Definition**: A streak is maintained by answering at least 1 question per calendar day (user's local timezone).
- **Streak display**: Visible on dashboard header, profile, and leaderboard card.
- **Streak Shield** (Pro only): Once per week, a missed day does not break the streak. Shield auto-activates; no user action required. Recharges Monday.
- **Streak milestones**: Visual acknowledgement at 3, 7, 14, 30, 60, 100 days. Brief animation, no modal interruption.
- **Storage**: Streak data lives in Supabase `user_streaks` table for logged-in users. Guest streaks are local-only (no shield, no leaderboard credit).

---

### 5.3 Leaderboard

**Purpose**: Social competition drives sign-ups and daily engagement. The leaderboard is the single strongest incentive to create an account.

#### Access
- **Visible to**: All users (read-only preview — top 10 visible without auth)
- **Participate**: Logged-in users only
- **Anonymous option**: User sets a display name during onboarding (separate from Clerk real name). Settings toggle switches between display name and "Anonymous #[rank]".

#### Boards at Launch (V1)
| Board | Reset | Description |
|---|---|---|
| Global Weekly | Every Monday 00:00 UTC | Primary competitive surface. Fresh start each week. |
| Global All-Time | Never | Hall of fame. Dominated by power users. Creates aspiration. |

*Topic boards (e.g., "Top in Async this week") → V2.*

#### Leaderboard Card Design
Each entry shows:
- Rank badge (#1, #2, #3 with gold/silver/bronze treatment)
- Avatar (Clerk avatar or initials fallback)
- Display name (or "Anonymous")
- Level badge (Apprentice → Distinguished)
- Weekly XP
- Current streak (flame icon + count)
- **Pro badge** (subtle amber glow indicator for Pro subscribers)

#### Data model
```
table: leaderboard_snapshots
- id
- user_id (FK → clerk user)
- display_name (nullable, falls back to "Anonymous")
- is_anonymous (boolean)
- weekly_xp
- alltime_xp
- current_streak
- level
- is_pro (boolean)
- week_start (ISO date — Monday)
- updated_at
```

Weekly snapshots are computed by a Supabase Edge Function running on cron (every Monday). Real-time position is derived from `xp_transactions` aggregate.

---

### 5.4 Mastery Path System

**Purpose**: Give users a structured sense of progression beyond raw XP. Anchors the "I'm getting better" feeling.

#### Topic Mastery States
Each of the 12 topic tags has a mastery state per user:

| State | Condition | Visual |
|---|---|---|
| Locked | 0 questions answered in topic | Grey |
| Exploring | 1–39% accuracy or < 5 answered | Blue |
| Developing | 40–69% accuracy, ≥5 answered | Amber |
| Proficient | 70–84% accuracy, ≥10 answered | Green |
| Mastered | ≥85% accuracy, ≥10 answered, SRS intervals ≥14 days | Gold glow |

"Mastered" topics show a permanent gold badge on the user's profile.

#### Content-Agnostic Design
The mastery thresholds are computed from existing `tagStats` in `useAnalytics`. Adding new question packs or topics plugs straight in — no schema changes needed.

---

### 5.5 AI Interview Mode (Pro)

**Purpose**: Hero Pro feature. Simulates a real technical JavaScript interview with voice + video. Post-session AI feedback report.

#### Session Structure
- **Length**: 8 questions per session
- **Difficulty distribution**: 2 easy + 3 medium + 2 hard + 1 code challenge (adaptive to user's weakest topics)
- **Timer per question**: 
  - Easy: 90 seconds
  - Medium: 3 minutes
  - Hard: 4 minutes
  - Code challenge: 6 minutes
- **Code challenge format**: Live code editor embedded in interview UI. AI verifies correctness of submitted code. Partial credit for near-correct solutions.
- **Interviewer persona**: AI voice interviewer with consistent name/persona (e.g., "Alex"). Uses ElevenLabs TTS for natural-sounding voice.

#### Infrastructure Stack
- **Video/Audio transport**: `@stream-io/video-react-sdk` — handles WebRTC, recording, real-time transport
- **Speech-to-text**: Stream's native transcription or Whisper API (transcript fed to Claude for grading)
- **AI evaluation**: Claude (claude-sonnet-4-6) grades each answer on 4 dimensions
- **Text-to-speech**: ElevenLabs for AI interviewer voice
- **Code verification**: Existing Worker-based sandbox (`lib/run/sandbox.ts`)

#### Grading Dimensions (per question)
| Dimension | Weight | What it measures |
|---|---|---|
| Technical accuracy | 40% | Correct, complete answer |
| Clarity | 25% | Structured explanation, no rambling |
| Confidence | 20% | Pace, filler word frequency, directness (from transcript analysis) |
| Completeness | 15% | Edge cases mentioned, depth of coverage |

#### Post-Interview Report (delivered within 60 seconds of session end)
- Overall score (0–100)
- Per-question breakdown with dimension scores
- Specific feedback per question: "You correctly identified closure scope but missed the garbage collection implication."
- Top 3 improvement areas
- Recommended questions to practice based on weak answers
- Sharable result card (URL-based, Pro only)

#### Session limits
- Pro: Unlimited sessions
- Free: 0 (feature is Pro-only, but show "Try a demo" preview with 2 questions — no grading — as conversion hook)

---

### 5.6 Additional AI Pro Features

#### AI Answer Grader
After submitting any answer, Pro users get a qualitative assessment: "Your answer is correct but missed the prototype chain explanation. Here's what a complete answer looks like: [...]". Replaces the current binary correct/incorrect feedback.

#### AI Explain This
On any question page, Pro users can open a contextual deep-dive panel. Claude explains the concept from first principles, connects it to related questions, and generates a custom analogy. Not a chat interface — a focused, structured explanation panel.

---

### 5.7 Pro Tier

**Price**: $9/month (USD), billed monthly. Annual plan ($7/mo × 12 = $84) as V2.

#### Pro Feature Bundle (V1)
| Feature | Description |
|---|---|
| Pro badge on leaderboard | Amber glow indicator, visible to all |
| Streak Shield | 1 free missed day/week, auto-activates |
| AI Answer Grader | Qualitative feedback on every answer |
| AI Explain This | Deep-dive explanations on any question |
| AI Interview Mode | Full voice+video mock interview with report |
| Early access to new question packs | First access when new content ships |

#### Entitlement model
Clerk user metadata stores `{ plan: "pro" | "free" }`. Set via Lemon Squeezy webhook → API route → Clerk `updateUserMetadata`. All Pro gates check `user.publicMetadata.plan === "pro"` — no separate Supabase role needed.

---

### 5.8 Payment Integration: Lemon Squeezy

**Why not Stripe**: Stripe has limitations for Indian-registered entities on international payouts. Lemon Squeezy is a Merchant of Record (MoR) — they collect payment, handle VAT/GST globally, and pay out to the founder. Zero tax compliance overhead.

#### Integration path
1. Create Lemon Squeezy store + Pro product variant ($9/mo)
2. Install `@lemonsqueezy/lemonsqueezy.js` SDK
3. Checkout: hosted Lemon Squeezy checkout overlay (no custom payment UI needed for V1)
4. Webhook: `POST /api/webhooks/lemonsqueezy` → verify signature → update Clerk user metadata
5. Cancellation/expiry webhook: downgrade user to `free`

#### Relevant webhook events
- `subscription_created` → set `plan: "pro"`
- `subscription_updated` → handle plan changes
- `subscription_cancelled` / `subscription_expired` → set `plan: "free"`

---

## 6. Data Schema (New Tables)

```sql
-- XP transaction log (source of truth for all XP)
CREATE TABLE xp_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'),
  event_type  TEXT NOT NULL, -- 'correct_easy', 'wrong', 'streak', etc.
  xp_delta    INTEGER NOT NULL,
  question_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- User streak state
CREATE TABLE user_streaks (
  user_id         TEXT PRIMARY KEY DEFAULT (auth.jwt()->>'sub'),
  current_streak  INTEGER DEFAULT 0,
  longest_streak  INTEGER DEFAULT 0,
  last_activity   DATE,
  shield_used     BOOLEAN DEFAULT false,
  shield_resets_at DATE,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Leaderboard (computed snapshots + live aggregate view)
CREATE TABLE leaderboard_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL,
  display_name   TEXT,
  is_anonymous   BOOLEAN DEFAULT false,
  weekly_xp      INTEGER DEFAULT 0,
  alltime_xp     INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  level          INTEGER DEFAULT 1,
  is_pro         BOOLEAN DEFAULT false,
  week_start     DATE NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- User display preferences
CREATE TABLE user_profiles (
  user_id       TEXT PRIMARY KEY DEFAULT (auth.jwt()->>'sub'),
  display_name  TEXT,
  is_anonymous  BOOLEAN DEFAULT false,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- AI interview sessions
CREATE TABLE interview_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'),
  stream_call_id   TEXT,
  status           TEXT DEFAULT 'pending', -- pending, active, completed
  questions        JSONB, -- array of question IDs used
  responses        JSONB, -- per-question transcript + code submissions
  scores           JSONB, -- per-question dimension scores
  overall_score    INTEGER,
  feedback_report  JSONB,
  created_at       TIMESTAMPTZ DEFAULT now(),
  completed_at     TIMESTAMPTZ
);
```

All tables use the same `auth.jwt()->>'sub'` RLS pattern from `auth-sync.md`.

---

## 7. Technical Architecture

```
User Action
    │
    ▼
XP Event → xp_transactions (Supabase) ← RLS: user_id match
    │
    ├── Streak update → user_streaks
    │
    └── Leaderboard aggregate → real-time from SUM(xp_delta) WHERE week_start = current_week
                                weekly snapshot → Edge Function cron (Monday 00:00 UTC)

Pro Gate Check
    │
    └── Clerk publicMetadata.plan === "pro"
            │
            ├── AI Answer Grader → /api/ai/grade → Claude API
            ├── AI Explain This → /api/ai/explain → Claude API  
            └── AI Interview → /api/interview/* → Stream SDK + ElevenLabs + Claude

Payment Flow
    │
    └── Lemon Squeezy Checkout (hosted overlay)
            │
            └── Webhook → /api/webhooks/lemonsqueezy → Clerk updateUserMetadata
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1–2)
- [ ] XP transaction schema + RLS policies
- [ ] `useXP` hook: computes daily/weekly/alltime XP from Supabase
- [ ] XP award on question answer (integrate with existing `markQuestionAnswered`)
- [ ] Streak tracking: `user_streaks` table + daily update logic
- [ ] User profiles table + display name / anonymous toggle (settings page)
- [ ] Dashboard XP widget (daily XP, level badge, streak flame)

### Phase 2: Leaderboard (Week 3–4)
- [ ] `leaderboard_snapshots` table + Monday cron Edge Function
- [ ] `/[locale]/leaderboard` page — Global Weekly board
- [ ] All-Time board tab
- [ ] Leaderboard card component (rank, avatar, name, streak, XP, Pro badge)
- [ ] Guest preview: top 10 visible, CTA to sign up to compete
- [ ] Anonymous toggle in user settings

### Phase 3: Mastery Paths UI (Week 4–5)
- [ ] Mastery state computation (extend `useAnalytics`)
- [ ] Topic mastery grid on dashboard
- [ ] Profile page with mastered topic badges
- [ ] Level badge displayed on dashboard header

### Phase 4: Payments + Pro Gate (Week 5–6)
- [ ] Lemon Squeezy store setup + product variant
- [ ] `/api/webhooks/lemonsqueezy` route
- [ ] Clerk metadata entitlement check → `useProStatus` hook
- [ ] Pro upgrade page (`/[locale]/pro`) with feature list
- [ ] Pro badge on leaderboard (visual)
- [ ] Streak Shield logic (Pro only)

### Phase 5: AI Features — Grader + Explain (Week 6–7)
- [ ] `/api/ai/grade` — Claude grades freeform answer vs question context
- [ ] AI Answer Grader panel on question page (Pro gate)
- [ ] `/api/ai/explain` — Claude deep-dive explanation
- [ ] AI Explain This panel on question page (Pro gate)
- [ ] Free tier preview: show grader/explain panels with blur + upgrade CTA

### Phase 6: AI Interview Mode (Week 8–10)
- [ ] Stream Video project setup + API keys
- [ ] `/[locale]/interview` page — session lobby
- [ ] Session creation: 8-question adaptive selection by weak topics
- [ ] Stream call UI: video + voice + timer per question
- [ ] Code challenge embed: Monaco editor within interview UI + Worker sandbox verification
- [ ] Real-time transcript → Claude grading pipeline
- [ ] ElevenLabs TTS for AI interviewer voice
- [ ] Post-interview report page
- [ ] Shareable result card (URL)
- [ ] Demo mode: 2-question no-grade preview for Free users

---

## 9. UX & Design Notes (Dark Forge system)

- **Leaderboard aesthetic**: Dense, data-forward table. Think Linear's issue list, not a gaming scoreboard. Top 3 get subtle rank treatment (no garish gold/silver/bronze icons — use typographic weight and amber text).
- **XP animations**: On XP gain, a brief `+20 XP` float-up animation using `motion/react` spring. Not intrusive, max 800ms.
- **Streak flame**: Minimal SVG flame icon, amber colour, number beside it. Pulse animation on streak milestone only.
- **Pro badge**: Small amber dot or `PRO` label in Geist Mono uppercase, 9px. No gradient shields or flashy crowns.
- **AI Interview UI**: Full-screen focused mode. Zinc void background. Timer ring (SVG arc) top-right. Question card centre. Video tile bottom-right corner (PiP style). No chrome, no distractions.
- **Upgrade CTA**: Shown as a locked state on AI features — blur overlay with "Unlock with Pro" in amber. No modal pop-ups. Inline, contextual.

---

## 10. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| XP abuse via alt accounts | Medium | Rate-limit by IP on question submit; XP floor 0/day |
| ElevenLabs cost spike | Low | Cache interviewer TTS audio for repeated question prompts |
| Stream SDK bundle size | Medium | Dynamic import the Stream SDK only on interview pages |
| Lemon Squeezy webhook replay attacks | Medium | Verify `X-Signature` header on every webhook; idempotency key on metadata update |
| Voice interview transcript quality | Medium | Fallback: allow typed answer if mic fails; still grade text response |
| 80-question corpus saturation for power users | High | Design interview question rotation + weight by SRS data to maximise variety; flag for content expansion in V2 |
| GDPR on voice/video recording | Medium | Store Stream recordings transiently (auto-delete 24h); disclose in privacy policy |

---

## 11. Out of Scope (V1)

- Topic-specific leaderboards
- Friends / follow graph
- Annual Pro pricing
- PDF progress export
- Custom profile themes
- Video facial/emotion analysis for confidence (V2 — Hume AI integration)
- Mobile app
- TypeScript / React / Node question packs (content V2)

---

## 12. Open Questions (Require External Decisions)

1. **Stream pricing tier**: Free tier supports up to 1,000 concurrent participants — confirm this covers early growth before billing kicks in.
2. **ElevenLabs voice choice**: Select a neutral, professional English voice. Confirm license allows commercial use in SaaS.
3. **Lemon Squeezy payout currency**: Confirm USD payout to Indian bank account is supported (it is, via wire transfer — verify current limits).
4. **Claude API rate limits**: At $9/mo, one AI interview session (8 questions × grading) costs ~$0.30–0.50 in tokens. Pro margin is healthy, but set per-user monthly session logging to monitor.
