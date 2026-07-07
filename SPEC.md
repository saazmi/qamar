# SPEC.md — Quran Memorization App for ADHD Learners (**Qamar**)

> **Purpose of this document**
> This is the master specification for a Quran memorization (hifz) app designed for people with ADHD. It is the single source of truth for *what* we are building, *why*, and *how it must behave*. It is written to be handed to Claude Code (or any sufficiently capable engineering agent) so the agent can build the project autonomously without further architectural clarification.
>
> **Lineage**: This project is a sibling of **Iqraa** (the Arabic reading-instruction app by the same owner). It inherits Iqraa's philosophy, technology stack, design system, project conventions, and offline-first discipline. Where this document is silent on a convention, the agent should assume the Iqraa convention applies. Where this document contradicts Iqraa, this document wins.
>
> **What this document does not contain**: code. Every technical decision is described in prose and data-shape diagrams. Implementation is the agent's job.

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Vision and Philosophy](#2-vision-and-philosophy)
3. [Target Users](#3-target-users)
4. [Scope and Versioning](#4-scope-and-versioning)
5. [Architecture Overview](#5-architecture-overview)
6. [Technology Stack](#6-technology-stack)
7. [Project Structure](#7-project-structure)
8. [Quran Content: Sourcing, Schema, and Licensing](#8-quran-content-sourcing-schema-and-licensing)
9. [The hifz-core Domain Model](#9-the-hifz-core-domain-model)
10. [Feature Specifications](#10-feature-specifications)
11. [The Reading View — Deep Specification](#11-the-reading-view--deep-specification)
12. [Audio Strategy](#12-audio-strategy)
13. [Notes System](#13-notes-system)
14. [Hifz Planning and Revision Scheduler](#14-hifz-planning-and-revision-scheduler)
15. [ADHD Design Doctrine](#15-adhd-design-doctrine)
16. [Design System](#16-design-system)
17. [Internationalization and RTL](#17-internationalization-and-rtl)
18. [Offline-First Strategy](#18-offline-first-strategy)
19. [Local Storage Specification (v1)](#19-local-storage-specification-v1)
20. [v2 Backend Readiness](#20-v2-backend-readiness)
21. [Accessibility Requirements](#21-accessibility-requirements)
22. [Testing Strategy](#22-testing-strategy)
23. [CI/CD and Distribution](#23-cicd-and-distribution)
24. [Open Source and Licensing](#24-open-source-and-licensing)
25. [Roadmap and Phases](#25-roadmap-and-phases)
26. [Definition of Done](#26-definition-of-done)
27. [Open Decisions for the Project Owner](#27-open-decisions-for-the-project-owner)
28. [Appendix A — Conventions for the Engineering Agent](#28-appendix-a--conventions-for-the-engineering-agent)

---

## 1. Project Identity

**Name**: **Qamar** (قمر — "the moon"). As with Iqraa, the display name lives only in `app.json` and a single i18n string. No hardcoded name anywhere in code.

**One-sentence definition**: An offline-first mobile app that helps people with ADHD memorize the Quran by making progress visible, sessions short, states simple, and revision automatic.

**Repository**: Public on GitHub from day one.

**License**: MIT for code. Quranic text, translations, tajweed annotations, and audio are third-party datasets with their own licenses — attributed in-app and in `LICENSE-CONTENT` (see §8.5 and §24).

**Funding model**: None. Free, ad-free, tracker-free, no accounts required in v1. Same as Iqraa.

**Relationship to prior work**: The memorization tracking engine is the `hifz-core` model already specified in the owner's earlier "Hifz Progress Tracking" spec (verse-level states, chunk-based revision scheduler). This document supersedes and extends that spec for the standalone-app case; §9 and §14 restate it fully so this document stands alone.

---

## 2. Vision and Philosophy

The app exists for one reason: **to let a person with ADHD open the app for five minutes, do one small meaningful hifz action, see their progress move, and leave feeling capable — every day, offline, for free.**

Every product decision flows from that sentence.

### Guiding Principles (inherited from Iqraa, adapted)

1. **The memorizer's workflow first, technology second.** Real hifz practice (learn a small portion → repeat → connect to previous portion → revise old material daily) is the pedagogy. The app digitizes that loop; it does not invent a new one.
2. **Quality over surface area.** The reading view with per-verse state tracking, done excellently, justifies the app alone. Everything else is layered on top.
3. **Offline-first is non-negotiable.** The full Quran text, translation, tracking, notes, and scheduler work with zero network forever. Only audio may touch the network, and only until cached (§12).
4. **No accounts, no tracking, no telemetry in v1.** Progress is local. v2 adds *optional* backup/sync — never a login wall (§20).
5. **Open source as a multiplier.** Forkable, translatable, self-hostable.
6. **Respect the learner's time and dignity.** No guilt mechanics, no punishing streaks, no "you let your hifz down" notifications. ADHD users are the primary audience and shame-based motivation actively harms them (§15).
7. **Reduce every interaction to its minimum viable friction.** For an ADHD user, one extra tap or one extra decision is the difference between doing the review and closing the app.

### What this app is *not*

- Not a full mushaf replacement (no page-accurate Madani layout in v1; verses flow as fragmented text blocks).
- Not a tafsir app. One French translation line per verse, period. Depth belongs to other tools.
- Not a tajweed *course*. Tajweed coloring (if the data spike succeeds, §8.3) is a reading aid, not instruction.
- Not a general Islamic super-app. No prayer times, qibla, adhkar. One job: hifz.
- Not gamified in the Duolingo sense. Progress visualization yes; leagues, gems, and streak-shaming, never.

---

## 3. Target Users

### Primary persona — "Adam"

A 26-year-old French-speaking software developer with diagnosed ADHD. He has wanted to memorize the Quran for years and has restarted Juz 'Amma four times. He doesn't fail at memorizing — he fails at *tracking and revising*: he loses the thread of what he knows, gets overwhelmed by the invisible backlog, and abandons the project. He needs: visible progress, tiny sessions, zero decision fatigue, and an app that tells him exactly what to do today.

### Secondary persona — "Khadija"

A 34-year-old mother of two in Belgium, undiagnosed but strongly ADHD-presenting. Memorizes with a weekly women's halaqa. Needs to log what the halaqa covered, review on her own schedule in 5-minute fragments, and take notes on verses her teacher explained. French is her strongest reading language.

### Tertiary persona — "Youssef"

A 19-year-old student, no ADHD, simply wants a clean free hifz tracker. He must be fully served by the same design — the ADHD-first constraints (§15) produce an app that is better for everyone, not a "special needs" app.

### Use cases the app must support

| Use case | Frequency | Critical features |
|---|---|---|
| "What should I do today?" cold open | Daily | Today screen with ≤3 concrete tasks (§10.2) |
| Learn a new small portion | Daily | Reading view, per-verse states, audio loop (§11, §12) |
| Mark a range as memorized after a session | Daily | Range operations (§9.4) |
| Revise old material without deciding what | Daily | Chunk scheduler with daily budget (§14) |
| Look up a verse's meaning mid-recitation | Constant | Inline FR translation toggle (§11.5) |
| Note down a teacher's remark on a verse | Weekly | Verse/surah notes (§13) |
| Listen to a qari to fix pronunciation | Constant | Per-ayah audio, repeat loop (§12) |
| See global progress ("how far am I?") | Weekly | Dashboard: grids, juz rings, heatmap (§10.5) |
| Fully offline use (travel, no data plan) | Common | Everything except uncached audio (§18) |

---

## 4. Scope and Versioning

### v1.0 — MVP (the goal of the initial build)

- Full Quran text (Hafs ʿan ʿĀṣim riwayah, 6,236 ayat), bundled, offline, with **full harakat**, in a simple beginner-legible font (§8.2, §16.3)
- **Fragmented verses**: every ayah is an individually tappable unit in the reading view (§11)
- Per-verse memorization state tracking via `hifz-core`: `learning` / `memorized` / derived `needsReview` (§9)
- Range marking (mark ayat 1–15 memorized in one action) (§9.4)
- French translation per verse, bundled, offline, toggleable inline (§8.4, §11.5)
- Per-ayah audio from one default qari: stream + persistent cache + per-surah download (§12)
- Notes attached to a verse or to a surah (§13)
- Hifz planning for ADHD: Today screen, chunk-based revision scheduler with daily budget, new-material pacing (§10.2, §14)
- Dashboard: surah grid views, juz completion rings, activity heatmap (§10.5)
- Full offline support for everything except first-time audio fetch
- French UI (i18n-ready for more)
- iOS, Android, **and web** targets — web ships in v1 with feature parity minus audio playback (see §6, §12.5, §18.1)
- Local-only storage (SQLite); JSON export/import backup (§19.4)
- No backend, no accounts

### v1.1 — Enhancements (architecture must allow, do not build in v1.0)

- **Tajweed coloring** of the Arabic text (letters colored by rule), behind a settings toggle — contingent on the data spike in §8.3
- Second qari option
- Blind-recitation test mode (hide text, reveal word-by-word, log hesitations)
- Audio on web (platform-branching cache to IndexedDB / Cache API — see §12.5)
- Additional UI languages (English, Arabic)

### v2.0 — Backend era

- Optional anonymous backup/sync so users don't lose progress on device loss (§20)
- Multi-device continuity
- Nothing in v1 may architecturally block this; nothing in v1 may depend on it

### Explicitly out of scope, ever (for this app)

- Page-accurate Madani mushaf rendering
- Tafsir corpora, multiple translations side-by-side
- Social features, leaderboards, public profiles
- Ads, purchases, paywalls, analytics SDKs

---

## 5. Architecture Overview

Same shape as Iqraa: a single Expo (React Native) app, all content bundled as static assets, all user state in local SQLite, no server in v1.

```
┌──────────────────────────────────────────────────────┐
│                     Expo App (TS)                    │
│                                                      │
│  Screens (Expo Router)                               │
│    Today · Surah list · Reading view · Dashboard     │
│    Notes · Settings · Downloads                      │
│                                                      │
│  hifz-core (pure TS, zero RN imports)                │
│    states · range ops · chunk derivation             │
│    revision ladder · task generation                 │
│                                                      │
│  Stores (Zustand)          DB (expo-sqlite)          │
│    ui, settings, session     progress, notes,        │
│                              audio-cache index,      │
│                              activity log            │
│                                                      │
│  Bundled content (read-only)                         │
│    quran text (+harakat) · structure · FR trans      │
│    [v1.1: tajweed annotations]                       │
│                                                      │
│  Audio layer (expo-av + expo-file-system)            │
│    stream → cache → offline replay                   │
└──────────────────────┬───────────────────────────────┘
                       │ network (audio CDN only, v1)
                       ▼
            EveryAyah / Quran Foundation CDN
```

**Data flow summary**: Screens never touch SQLite directly. Screens → hooks → `hifz-core` pure functions + `db/queries.ts`. `hifz-core` is side-effect-free and receives/returns plain data; persistence is an adapter around it. This keeps the engine unit-testable and reusable (it is also consumed by the owner's separate embeddable tracker project — do not break its public API casually).

---

## 6. Technology Stack

Inherited from Iqraa verbatim unless noted. The agent should not substitute alternatives without strong cause.

### Core runtime

| Library | Policy | Purpose |
|---|---|---|
| **TypeScript** | Latest stable | All files `.ts`/`.tsx`. No plain JS. |
| **Expo SDK** | Latest stable | Managed RN framework. |
| **React Native** | Pinned to Expo SDK | UI framework. |
| **Expo Router** | Latest stable | File-based routing. |

**Note on web** (revised): web ships as a v1 target alongside iOS/Android, with **feature parity minus audio playback**. The two original blockers are resolved as follows:
1. *Audio cache* is native-locked via `expo-file-system`; on web the audio controls render a "install the mobile app" notice instead. Full audio-on-web moves to v1.1 (see §12.5).
2. *Long-list perf*: FlashList's web build must be measured on the reference desktop target (mid-range laptop, latest Chromium) before ship — same 60fps goal as native (§11.6), applied to the web mid-range target instead of the Android low-end target.

Everything else (text, states, notes, scheduler, dashboard, export/import) must work on web from v1.0.

### UI and styling

| Library | Purpose |
|---|---|
| **NativeWind** | Tailwind-style utility classes, same as Iqraa. |
| **React Native Reanimated** | Transitions, state-change feedback, celebration micro-animations. |
| **React Native Gesture Handler** | Long-press, range-drag on grids. |
| **expo-font** | Arabic + Latin font bundling (§16.3). |
| **@shopify/flash-list** | **New vs Iqraa.** Virtualized lists. Mandatory for the reading view (Al-Baqarah = 286 verse blocks) and the 114-surah list. Plain FlatList is not acceptable for the reading view. |
| **lucide-react-native** | Icons. |
| **react-native-svg** | Juz rings, heatmap, progress visuals. |

### Storage and state

| Library | Purpose |
|---|---|
| **expo-sqlite** | All user state: verse states, notes, activity log, audio cache index. Migration runner, numbered migrations — same discipline as Iqraa §19.5. |
| **@react-native-async-storage/async-storage** | Settings only (theme, qari, translation toggle, daily budget). |
| **expo-file-system** | Audio cache storage (§12.3). |
| **Zustand** | App state. No Redux. |

### Audio

| Library | Purpose |
|---|---|
| **expo-av** (or **expo-audio** if the current Expo SDK has stabilized it — agent checks at project start and records the decision in `docs/architecture.md`) | Per-ayah playback, repeat loops, playback rate control. |

### Development and quality

Identical to Iqraa: ESLint (Expo config), Prettier, Jest + @testing-library/react-native, Maestro for E2E.

### Distribution

GitHub, EAS Build, EAS Submit. No Vercel in v1 (no web target). No Cloudflare in v1 (no backend).

### Explicitly rejected alternatives

Iqraa's rejection table applies (Flutter, native dual codebases, Capacitor, Redux, Realm, Firebase-in-v1). Additionally:

| Rejected | Why |
|---|---|
| Bundling full-Quran audio in the binary | One qari ≈ 600 MB–1.5 GB. Violates install-size sanity. Stream+cache instead (§12). |
| Runtime Quran-text API | Text is immutable; bundling is smaller than one screen of network error handling. Offline principle. |
| WebView-based mushaf renderers | Performance, offline complexity, and we're not rendering a mushaf anyway. |
| Verse-level SM-2 (per-ayah SRS) | 6,236 independently scheduled items buries an ADHD user in reviews. Chunk-based ladder instead (§14). |

---

## 7. Project Structure

```
qamar/
├── README.md
├── SPEC.md                            # This document, at repo root
├── LICENSE                            # MIT
├── LICENSE-CONTENT                    # Third-party data attributions (§8.5)
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── package.json / tsconfig.json / app.json / eas.json
├── babel.config.js / metro.config.js
├── .eslintrc.js / .prettierrc / .editorconfig / .gitignore
│
├── scripts/                           # Build-time content pipeline (§8.6)
│   ├── build-quran-content.ts         # Normalizes source datasets → src/content
│   └── verify-content.ts              # Checksums, ayah-count invariants
│
├── src/app/                           # Expo Router screens
│   ├── _layout.tsx                    # Root: theme, fonts, providers, migrations
│   ├── index.tsx                      # Today screen (§10.2)
│   ├── onboarding.tsx                 # First-run flow (§10.1)
│   ├── surahs/
│   │   ├── index.tsx                  # Surah list (§10.3)
│   │   └── [surahId]/
│   │       ├── index.tsx              # Reading view (§11)
│   │       └── grid.tsx               # Ayah grid view (§10.4)
│   ├── dashboard.tsx                  # Progress dashboard (§10.5)
│   ├── notes/
│   │   ├── index.tsx                  # All notes, searchable (§13)
│   │   └── [noteId].tsx
│   ├── review.tsx                     # Revision session player (§14.4)
│   └── settings/
│       ├── index.tsx
│       ├── downloads.tsx              # Audio download manager (§12.4)
│       └── about.tsx                  # Licenses & attributions
│
├── src/
│   ├── core/hifz/                     # hifz-core: PURE TS, no RN imports (§9)
│   │   ├── states.ts
│   │   ├── ranges.ts
│   │   ├── chunks.ts
│   │   ├── scheduler.ts
│   │   ├── types.ts
│   │   └── index.ts                   # Public API surface
│   ├── components/
│   │   ├── primitives/                # Button, Card, Text, Sheet, Toast, ProgressBar…
│   │   ├── quran/                     # AyahBlock, AyahMarker, SurahHeader, TranslationLine
│   │   ├── tracking/                  # AyahGrid, StateSheet, RangePicker, JuzRing, Heatmap
│   │   └── audio/                     # AyahAudioBar, RepeatControl, DownloadBadge
│   ├── content/                       # Generated by scripts/, committed
│   │   ├── structure.json             # 114 surahs meta (§8.1)
│   │   ├── ayah-index.json            # ayah → juz/hizb/page (§8.1)
│   │   ├── text/                      # per-surah Arabic JSON, harakat included
│   │   │   └── {001..114}.json
│   │   ├── translation-fr/            # per-surah FR JSON
│   │   │   └── {001..114}.json
│   │   └── tajweed/                   # v1.1, generated only if spike passes (§8.3)
│   ├── db/
│   │   ├── schema.ts                  # (§19.1)
│   │   ├── migrations.ts
│   │   └── queries.ts                 # All SQL in one place
│   ├── audio/
│   │   ├── sources.ts                 # Qari registry, URL builders (§12.2)
│   │   ├── cache.ts                   # Cache manager (§12.3)
│   │   └── player.ts                  # Playback + loop logic
│   ├── stores/                        # Zustand: settings.ts, session.ts, ui.ts
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/fr.json
│   ├── theme/                         # colors.ts, typography.ts, spacing.ts, index.ts
│   ├── hooks/
│   ├── utils/
│   └── types/
│
├── assets/
│   └── fonts/                         # Arabic + Latin fonts (§16.3)
│
├── tests/
│   ├── unit/                          # hifz-core has 100% branch-coverage target
│   ├── integration/
│   └── e2e/maestro/
│
└── docs/
    ├── architecture.md
    ├── content-pipeline.md            # How to regenerate src/content
    ├── audio-sources.md
    └── self-hosting.md
```

---

## 8. Quran Content: Sourcing, Schema, and Licensing

### 8.1 Structure data (bundled, immutable)

`structure.json` — 114 records:

```
SurahMeta {
  id: 1..114
  nameArabic: string          // "الفاتحة"
  nameTransliterated: string  // "Al-Fatiha" — primary display name (owner note 2026-07-07)
  ayahCount: number
  revelationPlace: "makkah" | "madinah"
}
```

Naming convention (owner note 2026-07-07): the transliterated form (Al-Fatiha, Al-Baqara, Al-Imran) is the primary display name across all screens, not a French translation. Translated titles ("L'Ouverture", "La Vache") are intentionally not shipped.

`ayah-index.json` — 6,236 records mapping `(surah, ayah)` → `{ juz: 1..30, hizbQuarter: 1..240, page: 1..604 }` (Madani page numbers used only for chunk sizing and juz aggregation, not for layout).

**Hard invariant**: Hafs/Kufan numbering, 6,236 ayat total. The basmalah is a counted ayah only in Al-Fatiha (1:1). `scripts/verify-content.ts` asserts the total and per-surah counts against a hardcoded table; the build fails if the source dataset disagrees.

### 8.2 Arabic text (bundled)

- **Riwayah**: Hafs ʿan ʿĀṣim.
- **Script**: **Imlaei (plain orthography) with full harakat**, single edition — the "normal writing, all harakat, beginner friendly" requirement. Uthmani is **not** bundled in v1 (owner decision D2, 2026-07-07); reintroducing it later is a content-pipeline change only, no architectural impact.
- **Primary source**: Tanzil.net text distributions (Imlaei "simple" and Uthmani editions, both with full diacritics). Fallback: fawazahmed0/quran-api static dumps or the Quran Foundation (Quran.com) API used **only at build time** by the content pipeline. The app never fetches text at runtime.
- Per-surah file shape:

```
AyahText {
  ayah: number
  text: string                // with harakat
  // v1.1 only, from tajweed dataset:
  segments?: { text: string; rule?: TajweedRule }[]
}
```

### 8.3 Tajweed coloring (v1.1, spike-gated)

- **Requirement source**: "if possible the colored letters with tajwid."
- **Approach**: use a pre-annotated tajweed dataset (e.g., the Tanzil-derived tajweed-annotated text used by several open-source projects, or Quran.com's tajweed script data), converted at build time into per-ayah `segments` where each segment optionally carries a rule id (`ghunnah`, `idgham`, `ikhfa`, `qalqalah`, `madd_*`, …). Rendering = colored `<Text>` spans per segment; no font tricks, no images.
- **Spike (timeboxed, 2 days, during Phase 1)**: verify that (a) a redistributable annotated dataset exists for the Imlaei edition, (b) segment boundaries align with the bundled Imlaei text, (c) colored spans render acceptably in the chosen font on Android. If any check fails → tajweed moves to the v1.1+ backlog and v1 ships plain black text with harakat. **The reading view must be built so that tajweed is purely additive** (a render mode on `AyahBlock`), never a structural dependency.
- Tajweed colors follow the conventional scheme (green ghunnah, red madd, etc.) defined as theme tokens `colors.tajweed.*`, with a legend screen in Settings.

### 8.4 French translation (bundled)

- One translation, offline. **Primary candidate**: Muhammad Hamidullah's French translation (widely redistributed via Tanzil's translation collection). The content pipeline records the exact edition and license text into `LICENSE-CONTENT`.
- Shape: per-surah JSON array of `{ ayah, text }`.
- Displayed only on demand (§11.5); never rendered by default (visual noise for memorization).

### 8.5 Licensing discipline

- Every dataset (text, translation, tajweed, audio source) gets an entry in `LICENSE-CONTENT`: source, edition, license, URL, retrieval date.
- The Settings → About screen displays these attributions in-app.
- If any candidate dataset's license is unclear, the agent flags it as a blocker in a GitHub issue instead of shipping it.

### 8.6 Content pipeline

`scripts/build-quran-content.ts` downloads/reads the raw source files, normalizes them into the shapes above, splits per-surah, and writes into `src/content/`. Generated files are **committed** (reproducibility + offline builds). `scripts/verify-content.ts` runs in CI: ayah-count invariants, no empty texts, harakat presence heuristic (each ayah must contain diacritic codepoints), translation/text alignment (same ayah counts per surah).

---

## 9. The hifz-core Domain Model

Pure TypeScript, zero React/RN imports, 100% unit-testable. Public API is versioned; it is shared conceptually (and ideally literally, as a package) with the owner's embeddable-tracker sibling project.

### 9.1 States

```
AyahState = "none" | "learning" | "memorized" | "needsReview"
```

- Exactly **two** user-settable states (`learning`, `memorized`). `none` is the unpersisted default. `needsReview` is **derived** by the scheduler (§14.3), never set manually.
- This 3-visible-state ceiling is an ADHD design constraint (§15). Do not add states in v1. Do not add a per-verse confidence slider.

### 9.2 Records (sparse)

```
AyahRecord {
  surah: 1..114
  ayah: number
  state: "learning" | "memorized"
  updatedAt: ISO8601
  memorizedAt?: ISO8601       // first transition to memorized
  lastReviewedAt?: ISO8601
  reviewCount: number         // successful chunk reviews credited to this ayah
}
```

Only non-`none` ayat are persisted. Full-Quran worst case: 6,236 rows.

### 9.3 State transitions

- `none → learning → memorized` (normal path), any state → any state allowed (users correct mistakes).
- First transition to `memorized` stamps `memorizedAt` and logs an `activity` row (§19.1) — the heatmap and "today +N" counters read from the activity log, not from state diffs.
- Every mutation is undoable for 5 seconds via the UI (§15); `hifz-core` supports this by making all mutations pure `(records, op) → records` so the previous snapshot is the undo.

### 9.4 Range operations

`applyRange(records, surah, fromAyah, toAyah, targetState)` — one call, one activity-log entry ("Marked Al-Mulk 1–15 memorized"), one undo unit. Required, not optional: real memorization proceeds by page/quarter, and per-verse clicking is exactly the tedium that makes ADHD users quit.

### 9.5 Aggregates (computed, never stored)

- `surahProgress(surahId)`, `juzProgress(juzId)` (via ayah-index), `overallProgress()` → `{ memorized, learning, needsReview, total, percent }`.
- Implemented as memoized selectors; recompute on state change is O(changed surah), not O(6236).

---

## 10. Feature Specifications

### 10.1 Onboarding (first run only)

- 3 screens max, skippable: (1) what the app does, in one sentence + one image of the grid filling green; (2) "Do you already have memorized portions?" → if yes, deep-link to range-marking flow so existing hifz is entered *immediately* (an empty app that ignores your 5 memorized ajzaa' is demoralizing); (3) daily-budget picker (1 / 3 / 5 review chunks per day, default 3) with plain-language explanation.
- No account, no email, no permission requests. Notifications permission is asked **later**, in context, only if the user enables the optional daily reminder in Settings.

### 10.2 Today screen (home, `index.tsx`)

The anti-overwhelm centerpiece. Answers "what do I do right now?" with at most **three cards**:

1. **Continue learning** — the current working portion (last `learning` range touched), e.g. "An-Naba 21–30 · continue" → opens reading view scrolled to that spot.
2. **Review** — today's due chunks from the scheduler, shown as *one* card ("2 reviews · ~6 min"), never as a list of overdue items. Tapping starts the review session (§14.4).
3. **Start something new** — visible only when there is no active learning range; suggests the next logical portion (next unmemorized ayat after the user's furthest progress, or Juz 'Amma for fresh users).

Below the cards: today's delta ("+ 4 verses today", review checkmarks) and a 7-day mini-heatmap. Nothing else. No global stats, no backlog counts, no red badges.

### 10.3 Surah list

As specified in the earlier tracker spec: 114 rows (FlashList), each with number, Arabic name, French transliteration, ayah count, tri-color progress bar (green memorized / amber learning / subtle marker for needsReview share). Header: overall "X / 6236" + search. Sort: canonical (default), by progress, recently active. Row tap → reading view; row long-press → quick actions sheet (open grid, mark whole surah…, add surah note).

### 10.4 Ayah grid view (per surah)

The GitHub-contribution-graph moment. One cell per ayah, numbered, RTL-ordered. Cell tap → verse bottom sheet (same sheet as reading view, §11.4). Cell long-press → quick state cycle with haptic + undo toast. "Mark range…" button → range picker (tap first cell, tap last cell, choose state, confirm). Toggle between grid ⇄ reading view is a segmented control in the surah header; the toggle preserves position by ayah.

### 10.5 Dashboard

- **Juz rings**: 30 completion rings (SVG), tap → juz detail listing its surah segments.
- **Activity heatmap**: GitHub-style calendar of activity-log events (learning marks + completed reviews). Neutral colors for empty days — an empty day is blank, never red (§15).
- **Overall bar** and per-surah mini-grid overview (114 small squares shaded by percent memorized).

### 10.6 Settings

Theme (light/dark/system), Arabic font size slider, translation on/off default, tajweed coloring toggle + legend (v1.1), qari selection (v1 has one; UI is a picker anyway), daily review budget, optional single daily reminder (time picker; plain neutral copy: "Ta session hifz t'attend" — no guilt variants), reduce motion, audio downloads manager (§12.4), export/import backup (§19.4), About/licenses.

---

## 11. The Reading View — Deep Specification

The killer feature, analogous to Iqraa's writing canvas in priority and polish budget.

### 11.1 Layout

- Vertical FlashList of **AyahBlock** components for the selected surah. Surah header (name, basmalah where canonical, progress bar) as list header.
- Each AyahBlock: the ayah's full Arabic text (harakat always on), flowing RTL, ending with an ayah-number marker (۝ + Arabic-Indic digit). Font size from settings (default 28pt equivalent, same rationale as Iqraa's Arabic sizing).
- **Two rendering modes** (owner note 2026-07-07, supersedes the earlier fragmented-only requirement):
  - **Fragmented** (default when the FR toggle is ON): each ayah is one discrete block with its own visual state (top surline + wash). Translation renders below the block.
  - **Continuous mushaf** (default when FR toggle is OFF): ayat flow as inline spans inside page-grouped `<Text>` paragraphs (grouped by Madani page from `ayah-index.json` for FlashList virtualization). Each ayah is still individually tappable/long-pressable and carries its own state visuals (background wash + colored ayah marker — no top border, since inline spans can't render borders).
- **Fragmentation invariant**: whichever mode is active, every ayah remains an individually addressable interaction unit; state changes and taps must not depend on layout mode.

### 11.2 Visual state encoding

- `none`: default text on default background.
- `learning`: soft amber background wash (token `colors.state.learningBg`).
- `memorized`: **green overline/surline across the top of the block plus a faint green background wash** (token `colors.state.memorizedBg`) — the "green surline = acquired" visual from the product vision.
- `needsReview`: memorized styling + a small leading badge (rotating-arrows glyph). Distinguishable by shape, not color alone (color-blind requirement).
- State changes animate briefly (150ms wash-in, Reanimated, respects reduce-motion).

### 11.3 Interactions — mode toolbar (revised 2026-07-07)

Long-press was dropped as the primary state-cycle gesture (owner note: undiscoverable, motor-accessibility-hostile, conflicts with web text-selection). All actions now dispatch on **single tap** and are disambiguated by the active toolbar mode.

**Reading toolbar** (sticky sub-header, mutually exclusive modes):

| Mode | Glyph | Tap on a verse |
|---|---|---|
| *(none active — default)* | — | no-op (pure reading) |
| **Marquer** | ● | cycles state `none → learning → memorized → none`, undo toast |
| **Sélection** | ⇥ | tap 1 = anchor, tap 2 = opens a state-picker sheet with the three state options; applies to the range; undo toast |
| **Notes** | ✎ | opens the note editor for that verse (§13) |
| **Écouter** | ▶ | plays audio starting at that verse (stub while D3 open) |
| **Détails** | ⓘ | opens the verse sheet (§11.4) |

Tapping the active mode's button clears back to no-active-mode. An instruction bar under the toolbar tells the user what to do next when a mode is active.

**Scroll position** is remembered per surah (last-read ayah), restored on reopen.

**Interaction invariant**: whichever mode is active, tap semantics are identical between fragmented and continuous rendering modes (§11.1).

### 11.4 Verse sheet (opened from Détails mode)

Entry: Détails mode → tap any verse. Contents top to bottom:

1. Surah:ayah reference + transliterated surah name.
2. Arabic text at 26pt, selectable.
3. **State controls**: three explicit segmented buttons — `Non commencé / En cours / Mémorisé`. Tap = apply + undo toast.
4. **Range shortcut** (shown only when the verse continues an existing state run): "Marquer jusqu'ici · N–M".
5. **Écouter** button: plays this ayah (stub while D3 open, toasts "bientôt disponible").
6. **Translation**: Hamidullah French text (always shown in the sheet).
7. **Notes**: read-only preview of every verse-scoped and surah-scoped note attached to this ayah. Each note has an eye toggle (§13.3) that expands it in place.

Sheet opens in <100ms perceived; translation loads from bundle instantly.

### 11.5 Inline translation toggle

A header toggle shows/hides a smaller FR line under every AyahBlock. Default **off** (memorization mode = Arabic only). The setting persists per user, not per surah.

### 11.6 Performance requirements

- 60fps scroll through Al-Baqarah (286 blocks) on a 2-year-old mid-range Android device. FlashList with fixed-estimate item sizing; Arabic text blocks must not remeasure on state change (state wash is an overlay, not a layout change).
- Cold open of the reading view <400ms after tap from surah list.
- **Web target**: 60fps scroll through Al-Baqarah on a mid-range laptop / latest Chromium. Measured before ship; if FlashList's web build cannot hit it, fall back to a windowed plain-DOM renderer inside the AyahBlock layer without changing the component API.

---

## 12. Audio Strategy

### 12.1 Principle

Text is bundled; audio is **streamed then cached, permanently**. After a verse (or downloaded surah) has been heard once, it is offline forever. The UI never blocks a state change or any non-audio feature on network.

### 12.2 Source

- **Default qari (v1, single)**: one clear, moderate-paced recitation with per-ayah files. Primary candidate: **Mahmoud Khalil Al-Husary (murattal)** — pedagogically standard for learners; alternates: Muhammad Siddiq Al-Minshawi (murattal), Mishary Alafasy. Final pick is Open Decision D3 (§27).
- **Hosting**: EveryAyah.com-style per-ayah MP3 layout (`{surah:3}{ayah:3}.mp3`) or the Quran Foundation audio CDN. `src/audio/sources.ts` abstracts the URL scheme behind a `QariSource` interface so adding qaris or swapping CDNs is config, not code. Verify the chosen source's redistribution/hotlinking terms during Phase 1; record in `LICENSE-CONTENT` and `docs/audio-sources.md`.

### 12.3 Cache manager (`src/audio/cache.ts`)

- On play: if file exists in `FileSystem.documentDirectory/audio/{qari}/{surah}/{ayah}.mp3` → play local; else stream while writing to cache (or fetch-then-play if streaming-while-writing is unreliable in expo-av — agent decides, documents).
- SQLite table `audio_cache` indexes cached files (qari, surah, ayah, bytes, cachedAt) for the downloads manager and integrity checks.
- No automatic eviction in v1 (full-Quran cache for one qari ≈ manageable; the downloads screen shows usage and offers per-surah deletion).

### 12.4 Download manager (Settings → Téléchargements)

- Per-surah and per-juz "download all ayat" with progress, pause/resume, wifi-only toggle (default on).
- Storage usage display; delete per surah/juz.

### 12.5 Playback behaviors

- Per-ayah play from the verse sheet and from an inline play glyph on each AyahBlock.
- **Repeat loop**: repeat current ayah ×3 / ×5 / ∞ (core memorization workflow).
- **Range play**: play ayat N→M sequentially with optional per-ayah repeat count — this is the "listen to your new portion on loop" mode; reachable from the range picker and the Today "continue learning" card.
- Speed 0.75/1.0/1.25 (expo-av rate with pitch correction).
- Audio keeps playing with screen off (background audio mode enabled in app config).
- Offline + uncached: play button shows a subtle cloud-off icon; tapping explains and offers to queue the download. Never a modal error.
- **On web (v1)**: audio controls render a subtle "Écoute disponible sur l'app mobile" notice with a link to the store listings, instead of a play button. All other verse-sheet controls (state, translation, notes) remain fully functional. Audio-on-web is v1.1 (see §4).

---

## 13. Notes System

### 13.1 Model (revised 2026-07-07 — text + canvas kinds)

```
Note {
  id: string
  scope: "ayah" | "surah"
  kind: "text" | "canvas"    // exclusive per note; no mixing
  surah: 1..114
  ayah?: number              // present iff scope = "ayah"
  body: string
  createdAt / updatedAt: ISO8601
}
```

- Multiple notes per verse/surah allowed. Each note is one kind only — text or canvas — no mixed rich content (owner constraint 2026-07-07: keep it simple).
- **Text kind**: `body` is the raw text, max 5,000 chars. No markdown v1; storage stays raw so v2 can upgrade rendering without migration.
- **Canvas kind**: `body` is `JSON.stringify({ ar, strokes })` where `ar` is the aspect ratio (height/width) captured at draw time, and `strokes` is an array of polylines in a fixed 800×1200 internal coordinate space (`{ c: color, w: strokeWidth, p: [[x,y]...] }`). Character cap does not apply. Legacy notes without `kind` are migrated to `text` on load; legacy canvas bodies stored as bare stroke arrays parse to `ar = 1.5`.
- **Storage note**: current persistence layer is AsyncStorage (v1). Handwritten canvas notes can push past Android's default 6 MB app-scoped AsyncStorage limit; the editor toasts a warning when the notes payload passes 4 MB. A follow-up moves canvas bodies to `expo-file-system` (one file per note, only the id in the store) before v1 ship if heavy note-taking is expected.

### 13.2 UX

- **Notes mode** (§11.3) opens a full-screen editor sheet on tap. The editor has:
  - existing notes list (each note shown as a small artifact — canvas thumbnail or 2-line text preview)
  - a T / ✎ toggle to pick the kind of the next new note
  - text area or drawing canvas depending on the toggle
  - `Ajouter` button to commit the new note
- **In-place expand** via an eye icon on each note card (both editor and Détails sheet). Tap → the note fills the sheet width in place (read-only). Tap again → collapse. No new modal, no navigation.
- **Ayah glyph** (SPEC §11): a small gold ✎ appears just before the ayah marker (`✎ ۝5`) whenever the verse has at least one note. Renders in both fragmented and continuous views.
- **Surah notes** (planned): overflow menu on surah header opens the same editor with `scope='surah'`. Rendered read-only in the Détails sheet alongside verse notes.
- **Notes screen** (`notes/index.tsx`, planned): all notes, newest first, filter by surah, full-text search (SQLite `LIKE` at this scale; FTS5 if trivially available in expo-sqlite).
- **Delete** = 5-second undo snackbar, no modal confirm (SPEC §15.3). Undo restores the full note kind + body.

### 13.3 Canvas rendering

- Editor `Canvas` component: PanResponder captures pointer input, `react-native-svg` renders polylines. Minimum 3-pixel distance between recorded points (in internal coords) → 40–60% fewer stored points with no visible quality loss. Height capped at 60% of window; width fills the container.
- Read-only `CanvasView`: renders the stored strokes at the note's saved aspect ratio. Optional `width` prop fixes size (used for thumbnails); omitted, the view measures its container and fills it (used for the in-place expanded state).
- All polylines use `vectorEffect="non-scaling-stroke"` so pen thickness stays in display pixels regardless of aspect stretch.

---

## 14. Hifz Planning and Revision Scheduler

The mechanism from the owner's earlier tracker spec, restated as normative here. Lives entirely in `hifz-core/scheduler.ts` + `chunks.ts`; pure functions over `(records, ayahIndex, now, settings)`.

### 14.1 Chunking

- A **chunk** = a contiguous run of `memorized` ayat within one surah, auto-derived by merging adjacent records, then splitting runs longer than one Madani page (via ayah-index) into page-sized pieces; fixed 15-ayah windows as fallback where page data is absent.
- Chunks are recomputed from records on demand — never stored. Chunk identity is `(surah, startAyah, endAyah)`; the scheduler must tolerate chunk boundaries shifting as the user memorizes more (credit carries via per-ayah `reviewCount`/`lastReviewedAt`, not via chunk ids).

### 14.2 Review ladder

- Chunk `intervalDays` ladder: `1 → 3 → 7 → 14 → 30 → 60` (capped), indexed by the chunk's `min(reviewCount)` over member ayat.
- Chunk `lastReviewedAt` = `max` over member ayat.

### 14.3 Due logic and `needsReview`

- A chunk is **due** when `now − lastReviewedAt > intervalDays`. All its ayat render as `needsReview`.
- **Daily budget**: the scheduler returns at most N due chunks per day (setting, default 3), most-overdue first. Overflow is silent — the UI shows "3 révisions aujourd'hui", never "47 en retard". No backlog number is ever rendered anywhere in the app.

### 14.4 Review session player (`review.tsx`)

- Presents due chunks one at a time: chunk reference ("Al-Mulk 1–15"), optional audio range-play, and two big buttons: **"Récité ✓"** (increments ladder: stamps `lastReviewedAt=now`, `reviewCount+1` on member ayat) and **"Difficile"** (stamps `lastReviewedAt=now`, steps the ladder position *down* one rung by decrementing effective reviewCount — implementation via a per-ayah `ladderOffset` or equivalent; agent chooses, tests thoroughly).
- Optional self-test aid: "Masquer le texte" toggle that blurs the chunk's text until tapped (precursor of the v1.1 blind mode).
- Session end: brief celebration (respecting reduce-motion) + updated Today screen. Total interaction cost per review: 2 taps.

### 14.5 New-material pacing

- The Today screen's "continue learning" card nudges converting `learning` → `memorized` when the user marks a review of their working range, and suggests the *next* small portion (default suggestion size: 5 ayat or to the end of the current page, whichever is smaller). Suggestions are dismissible and never queue up.

---

## 15. ADHD Design Doctrine

Normative constraints. Every screen and copy string is reviewed against this list.

1. **≤3 choices at any decision point.** The Today screen's three cards, the three state buttons, the three repeat options. If a design needs a fourth option, redesign it.
   - **Owner override 2026-07-07**: the reading toolbar (§11.3) has five mode buttons (Marquer / Sélection / Notes / Écouter / Détails). Accepted as a mode-picker rather than a decision-point: the surrounding *reading* action doesn't demand a choice, and modes are persistent + interchangeable rather than terminal branches. Individual sheets (state picker, Détails buttons) still respect the ≤3 rule.
2. **≤2 taps to any primary action** from the relevant screen (state change, play, mark reviewed).
3. **Undo, never confirm.** Destructive-feeling actions get a 5s undo snackbar. Modal confirmations are banned except for data export/delete-all.
4. **No backlog visibility.** Overdue counts, red badges, and "you missed N days" copy are banned app-wide.
5. **Progress is always visible and always additive.** Deltas ("+4 aujourd'hui"), filling grids, rings. Empty days are blank, not red.
6. **Micro-sessions are first-class.** Every flow (one review chunk, one ayah loop, one range mark) completes meaningfully in under 5 minutes and ends at a natural stopping point with a small completion cue.
7. **Celebrations are brief and finite.** ≤1.5s animation on milestones (chunk done, surah completed, juz completed). Respect reduce-motion. No XP, no levels, no currency.
8. **One daily reminder maximum**, opt-in, neutral copy, user-chosen time. No re-engagement notifications, ever.
9. **No dead-end empty states.** Every empty screen proposes exactly one next action.
10. **Consistency over novelty.** The verse sheet, the state colors, and the button order are identical everywhere they appear.

---

## 16. Design System

### 16.1 Philosophy

Inherited from Iqraa: calm, focused, beautiful; a thoughtfully designed textbook, not a game. Semantic tokens only (`colors.accent`, `colors.state.memorizedBg`) — themes swap token values; no raw hex in components.

### 16.2 Color palette

Same warm-neutral base as Iqraa, with the accent decision resolved for this app: **deep green** is the natural accent for a Quran memorization app (green = acquired is already the core visual metaphor), supported by a **muted gold** secondary — echoing the owner's established green/gold direction for Arabic-Islamic apps.

Light theme:
- Background: very light warm off-white (`#FAF7F2`)
- Surface: pure white
- Primary text: very dark warm grey (`#1F1B16`)
- Secondary text: medium warm grey
- **Accent / memorized**: deep calm green (e.g. `#2D6A4F` family; final value tuned for AA contrast)
- **Secondary accent**: soft muted gold (e.g. `#C9A227` family) — used sparingly: milestones, juz rings, highlights
- Learning state: muted amber
- needsReview marker: the accent green desaturated + badge glyph
- Error (rare): muted rose

Dark theme: deep warm near-black (`#1A1714`) background, slightly lighter warm surfaces, warm off-white text, same accents slightly desaturated. Both themes meet WCAG AA (§21).

Tajweed rule colors (v1.1) live in their own token group `colors.tajweed.*` and must remain legible on both themes.

### 16.3 Typography

- **French UI**: Inter, 16px base, 1.5 line-height; headings 600 weight at 20/24/32/40.
- **Arabic Quran text**: a beginner-legible naskh with excellent harakat rendering. Primary candidate: **Noto Naskh Arabic** (clean, modern, robust diacritic placement — better for the "simple beginner-friendly" requirement than the more calligraphic Amiri). Bundle **Amiri** as the secondary/settings alternative. Default size 28px equivalent, user-adjustable 22–40.
- Font rendering spike in Phase 1: harakat collision check at all sizes on Android; ayah marker (۝) rendering; if tajweed spike passes, colored-span rendering in the chosen font.

### 16.4 Spacing, components, icons, responsiveness

Identical to Iqraa §17.4–17.7: 8-point grid; primitives (`Button`, `Card`, `Text` with `arabic-body`/`arabic-display` roles, `Sheet`, `Toast`, `ProgressBar`, `Tag`); Lucide icons; 44pt targets; single-column mobile, two-column tablet where useful.

New composite components this app owns: `AyahBlock`, `AyahGrid`, `StateSegmentedControl`, `JuzRing`, `ActivityHeatmap`, `AyahAudioBar`, `RangePicker`.

---

## 17. Internationalization and RTL

- UI chrome is **LTR French**; Quran text surfaces (AyahBlock, grid ordering, verse sheet Arabic) are **explicitly RTL**, independent of `I18nManager` global flag — same mixed-direction discipline as Iqraa §16.
- All UI strings in `src/i18n/locales/fr.json`; zero hardcoded strings; keys in English.
- Numbers: Western Arabic numerals in UI; ayah markers use Arabic-Indic digits (٦٧) inside Arabic text only. Surah/ayah references in UI as "67:15".
- Architecture must allow adding `en.json` / `ar.json` (v1.1) without refactor; note that a future Arabic UI would flip chrome to RTL — do not hardcode left/right, use start/end.

---

## 18. Offline-First Strategy

### 18.1 Works offline, always (v1.0)

Quran text (all scripts bundled), structure, translation, all tracking and state changes, notes, scheduler and review sessions, dashboard, settings, previously cached/downloaded audio, export/import.

**Web target**: same offline guarantees via a Service Worker cache of the app shell + bundled content assets. First visit fetches over network; subsequent visits work fully offline (audio excepted — see §12.5). User state persists via `expo-sqlite`'s web build (WASM + IndexedDB) — no data crosses the network in v1 (§4, §20).

### 18.2 Requires network

Only: first-time fetch of an uncached audio file (native), the download manager (native), and — on web — the very first visit to warm the Service Worker cache. Everything degrades gracefully (§12.5); network state never blocks or delays any non-audio interaction.

### 18.3 Budget

- App binary target: **under 60 MB** (text JSON ≈ 6–8 MB total for two scripts + translation; fonts ≈ 2–4 MB; no bundled audio/video).
- Audio cache: user-controlled, surfaced in Downloads.

### 18.4 Persistence

All user state in SQLite via numbered migrations, created on first launch. AsyncStorage for settings only. Airplane-mode E2E test on both platforms is a release gate (§26).

---

## 19. Local Storage Specification (v1)

### 19.1 SQLite schema (described, not SQL)

- **ayah_state**: `(surah, ayah)` PK, `state`, `updated_at`, `memorized_at`, `last_reviewed_at`, `review_count`, `ladder_offset`. Sparse (no `none` rows). Indexes on `state` and `last_reviewed_at`.
- **notes**: `id` PK, `scope`, `surah`, `ayah` nullable, `body`, `created_at`, `updated_at`. Index on `(surah, ayah)`.
- **activity_log**: `id` PK, `type` (`marked_learning` | `marked_memorized` | `review_done` | `review_hard` | `range_op`), `surah`, `ayah_from`, `ayah_to`, `at`. Feeds heatmap and Today deltas. Append-only.
- **audio_cache**: `(qari, surah, ayah)` PK, `bytes`, `cached_at`.
- **meta**: key-value (schema_version, install_id, last_opened_surah/ayah).

### 19.2 Access discipline

All SQL lives in `db/queries.ts`. Screens use hooks; hooks call queries + hifz-core. No inline SQL in components. Writes are transactional per user action (a range op is one transaction).

### 19.3 install_id

A random UUID generated on first launch, stored in `meta`. Used for nothing in v1; becomes the anonymous sync identity seed in v2 (§20). Never displayed, never transmitted in v1.

### 19.4 Export / import

- Export: one JSON file `{ version, exportedAt, ayahStates[], notes[], activityLog[], settings }` via the OS share sheet. This is the v1 answer to "people lose their info": a manual backup that round-trips losslessly.
- Import: validates version + invariants, previews counts ("2,431 verses, 57 notes — remplacer les données actuelles ?"), then replaces atomically. This is one of the two permitted modal confirmations (§15.3).

## 20. v2 Backend Readiness

v1 ships no backend, but must not paint us into a corner:

- Every user-data row carries `updated_at`; the activity log is append-only with client-generated ids — both prerequisites for last-write-wins or log-replay sync.
- `install_id` exists from day one (§19.3).
- The export JSON format **is** the future sync payload format; version it (`"version": 1`).
- v2 sketch (non-normative): anonymous device-key auth, end-to-end plaintext-minimal payloads, small serverless backend (Cloudflare Workers + D1/KV, mirroring Iqraa's v1.1 infrastructure choices). Optional; the app must remain fully functional without ever enabling it.
- The agent must not implement any of this in v1 — only respect the constraints above.

---

## 21. Accessibility Requirements

Iqraa §18 applies in full: WCAG 2.1 AA contrast on both themes; `accessibilityLabel` on every interactive element (AyahBlocks announce "Sourate Al-Mulk, verset 3, mémorisé"); 44pt targets (grid cells may render smaller than 44pt visually but must have ≥44pt hit slop); reduce-motion respected everywhere including state washes and celebrations; OS font scaling honored for UI text (Arabic text has its own in-app slider); state never conveyed by color alone (needsReview badge, note glyph); no flashing >3Hz; plain-language French, ≤3 navigation levels; long-press actions always have a tap-reachable equivalent (the verse sheet) for motor accessibility.

---

## 22. Testing Strategy

- **hifz-core**: exhaustive unit tests, 100% branch-coverage target — state transitions, range ops (edges: single ayah, whole surah, overlapping existing states), chunk derivation (merging, page splitting, boundary shifts), ladder math including "Difficile" demotion, due logic with fake clocks, budget capping.
- **Content pipeline**: `verify-content.ts` in CI — 6,236 total, per-surah counts, harakat presence, text/translation alignment.
- **DB layer**: migration up-from-empty and up-from-v(n−1) tests; export→import round-trip property test.
- **Components**: verse sheet state buttons, undo snackbar behavior, grid long-press cycle.
- **E2E (Maestro)**: cold open → Today → start review → complete chunk; mark range in grid; airplane-mode smoke (open surah, change states, play cached audio); download surah audio then replay offline.
- **Performance gate**: scripted scroll of Al-Baqarah on a low-end Android reference device, frame-drop budget documented in `docs/architecture.md`.

---

## 23. CI/CD and Distribution

- GitHub Actions: lint, typecheck, unit + content tests on every PR; Maestro cloud (or emulator job) on main.
- EAS Build for binaries; EAS Submit for stores; GitHub Release with APK attached per tagged release.
- Conventional commits; one concept per commit; English commit messages (Iqraa Appendix B discipline).

---

## 24. Open Source and Licensing

- MIT (code) at root; `LICENSE-CONTENT` enumerating: Quran text edition(s) (Tanzil terms), French translation edition, tajweed dataset (if shipped), qari audio source terms, fonts (OFL).
- README with screenshots, philosophy paragraph, self-hosting/fork notes; CONTRIBUTING; Contributor Covenant.
- In-app About screen mirrors all attributions (§8.5).

---

## 25. Roadmap and Phases

### Phase 0 — Foundations (1 week)
Repo scaffold per §7, theme tokens, primitives, i18n skeleton, SQLite + migration runner, CI skeleton.

### Phase 1 — Content pipeline + spikes (1–2 weeks)
`build-quran-content.ts` + `verify-content.ts`; bundle structure/text/translation. **Spike A**: font/harakat rendering (§16.3). **Spike B**: tajweed dataset feasibility (§8.3, timeboxed 2 days). **Spike C**: audio source terms + stream-cache prototype (§12.2–12.3). Record all three outcomes in `docs/`.

### Phase 2 — hifz-core (1 week)
Full engine + exhaustive tests. This phase has zero UI; it is done when the test suite proves §9 and §14.

### Phase 3 — Core screens (2–3 weeks)
Surah list, reading view (§11) with states/sheet/undo, ayah grid, range picker. Performance pass on Al-Baqarah.

### Phase 4 — Audio (1–2 weeks)
Player, repeat/range loops, cache manager, downloads screen.

### Phase 5 — Planning layer (1–2 weeks)
Scheduler wiring, Today screen, review session player, notes, dashboard.

### Phase 6 — Polish + a11y + offline hardening (2 weeks)
Onboarding, settings, export/import, celebrations, accessibility audit, airplane-mode E2E, copy review (French reviewed by owner).

### Phase 7 — v1.0 Release
Docs, screenshots, store listings, TestFlight/Play internal → production, GitHub Release.

**Realistic elapsed time**: solo evenings/weekends 3–5 months; focused full-time 6–9 weeks. The reading-view performance work and audio caching are where the buffer goes.

---

## 26. Definition of Done (v1.0)

- [ ] All 114 surahs readable end-to-end with full harakat on iOS and Android
- [ ] 6,236-ayah invariant enforced in CI; text/translation aligned per surah
- [ ] Every ayah individually tappable with the three-state model, long-press cycle, and 5s undo
- [ ] Range marking works across every surah including edge cases (whole surah, single ayah)
- [ ] Scheduler produces correct due chunks under fake-clock tests; daily budget respected; "Difficile" demotes correctly
- [ ] Today screen never shows more than 3 cards and never shows a backlog count
- [ ] Notes: create/edit/delete/search for both scopes; glyph indicators render
- [ ] French translation displays in sheet and inline-toggle modes
- [ ] Audio: per-ayah play, ×3/×5/∞ repeat, range play, speed control, background playback; cached audio replays in airplane mode; per-surah download/delete works
- [ ] Al-Baqarah scrolls at 60fps on the reference low-end Android device
- [ ] App binary under 60 MB
- [ ] Airplane-mode E2E passes on both platforms
- [ ] Export/import round-trips losslessly (property-tested)
- [ ] WCAG AA contrast both themes; VoiceOver/TalkBack basic flows tested; reduce-motion respected
- [ ] All UI strings in `fr.json`; no hardcoded strings; no hardcoded app name outside `app.json`/i18n
- [ ] All licenses/attributions present in repo and in-app
- [ ] All tests green in CI; no `console.log` in production; no `TODO` without a linked issue
- [ ] Store submissions done; GitHub Release tagged with APK

---

## 27. Open Decisions for the Project Owner

The agent must not resolve these silently; open a GitHub issue for each at project start.

- **D1 — App name**: **Resolved — Qamar** (2026-07-07).
- **D2 — Script default**: **Resolved — Imlaei only** (2026-07-07). Uthmani not bundled in v1.
- **D3 — Qari**: **Deferred** (owner note 2026-07-07): licensing concern flagged. Al-Husary via EveryAyah is the SPEC placeholder pending verification; owner will investigate CC-licensed / open-source qari options before v1 ships audio. Architecture (`QariSource` interface, §12.2) already makes the swap config-only. Until resolved, treat audio features as "must not block ship if source unavailable" — v1 may ship text-only if needed.
- **D4 — French translation edition**: **Resolved — Muhammad Hamidullah** (2026-07-07), via Tanzil redistribution. Exact edition + license text captured during Phase 1 content-pipeline run.
- **D5 — Tajweed in v1.1**: **Low priority** (owner note 2026-07-07) — worth exploring, not urgent. Run Spike B opportunistically inside Phase 1; if it slips, tajweed simply stays in the v1.1+ backlog. Ship v1 with plain black text + harakat regardless. Reading view remains architected so tajweed is purely additive (§8.3).
- **D6 — Daily reminder default**: **Resolved — opt-in, off by default** (2026-07-07). Matches §15.4 and §15.8; discoverability handled via a one-time hint in Settings on first Today-screen visit.

---

## 28. Appendix A — Conventions for the Engineering Agent

Iqraa Appendix B applies verbatim (file-creation discipline, conventional commits, ask-when-unsure via GitHub issues, performance profiling on real low-end Android before "done", no silent architectural deviations). Additions specific to this project:

1. **Quranic text integrity is sacred.** Never hand-edit generated content files; all changes flow through the pipeline + verifier. Any rendering that could drop or reorder harakat/characters (custom text measurement, span splitting for tajweed) must be diffed against source text in tests.
2. **hifz-core purity.** No React, RN, or IO imports inside `src/core/hifz/`. Its public API changes require a spec-update PR first.
3. **ADHD doctrine review.** Every PR that adds UI must state, in its description, how it complies with §15 (choices ≤3, taps ≤2, no backlog surfacing, undo-not-confirm).
4. **Copy tone.** All French strings: warm, brief, zero guilt. The project owner reviews all user-facing French before release.
5. **Quality bar** (inherited, adapted): "Functional" is not the goal. "Calm, fast, and trustworthy enough that someone with ADHD builds a years-long hifz habit on it" is the goal. When in doubt, choose the option that better serves a distracted user with 4 minutes, one hand, and a noisy room.

---

*End of SPEC.md.*
