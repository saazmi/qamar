# Architecture

See [SPEC.md §5](../SPEC.md#5-architecture-overview) for the canonical diagram.

## Phase 1 spike outcomes

### Spike A — Font / harakat rendering (2026-07-07)

- **Font source**: `@expo-google-fonts/{noto-naskh-arabic,amiri,inter}` bundle Google-hosted OFL 1.1 fonts as bundled assets, no manual TTF download required.
- **Loaded in `src/app/_layout.tsx`** via `useFonts` — app renders a spinner until the fonts are ready. Six faces: Inter 400/600/700, Noto Naskh Arabic 400/700, Amiri 400.
- **Smoke test**: Today screen lists first 5 surahs with Arabic names + French names; reading view (`/surahs/{id}`) renders the full surah in Noto Naskh Arabic at 28pt with harakat, plus the Hamidullah French translation per verse.
- **Result**: harakat render cleanly on web (Chromium desktop). Native Android/iOS render TBD once the user boots the app.
- **Outcome**: **PASS on web**; Android/iOS pending user verification. If Android harakat placement is off at large sizes, fall back to Amiri (already bundled).

### Spike B — Tajweed dataset (Phase 1, low-priority per D5)

Not yet run.

### Spike C — Audio source (Phase 1)

Blocked pending D3 owner research.

## Decisions recorded here

- **Expo audio module**: TBD Phase 1 — `expo-av` vs `expo-audio` (SPEC §6). Currently `expo-av ^16.0.8`. Record the pick and reason.
- **Streaming-while-writing vs fetch-then-play**: TBD Phase 1 (SPEC §12.3).
- **Frame-drop budget** (Al-Baqarah scroll, low-end Android reference device): TBD Phase 3 (SPEC §22).
- **Dep resolution flag**: `--legacy-peer-deps` used for `zustand`, `lucide-react-native`, `nativewind`, `eslint`, and web deps. Root cause: transitive `react-dom` peer wants `react@19.2.7` while RN 0.86 pins `react@19.2.3`. Harmless in practice — we do not use react-dom features that changed between those patches. Revisit if RN bumps react.
- **Jest pin**: `jest@^29` (not 30). `jest-expo@57` transitively requires `jest-watch-typeahead@2` which caps at jest 29. Revisit when jest-expo relaxes the peer.
- **Web target**: SPEC §4/§6 defer web to v1.1. Web deps (`react-native-web`, `react-dom`, `@expo/metro-runtime`) are installed to keep the option open and to allow layout eyeballing in a browser during dev. The two SPEC blockers remain — audio cache path and long-list perf — and must be resolved before web ships as a v1 target.
