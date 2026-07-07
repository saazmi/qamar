# Architecture

See [SPEC.md §5](../SPEC.md#5-architecture-overview) for the canonical diagram.

## Decisions recorded here

- **Expo audio module**: TBD Phase 1 — `expo-av` vs `expo-audio` (SPEC §6). Currently `expo-av ^16.0.8`. Record the pick and reason.
- **Streaming-while-writing vs fetch-then-play**: TBD Phase 1 (SPEC §12.3).
- **Frame-drop budget** (Al-Baqarah scroll, low-end Android reference device): TBD Phase 3 (SPEC §22).
- **Dep resolution flag**: `--legacy-peer-deps` used for `zustand`, `lucide-react-native`, `nativewind`, `eslint`, and web deps. Root cause: transitive `react-dom` peer wants `react@19.2.7` while RN 0.86 pins `react@19.2.3`. Harmless in practice — we do not use react-dom features that changed between those patches. Revisit if RN bumps react.
- **Jest pin**: `jest@^29` (not 30). `jest-expo@57` transitively requires `jest-watch-typeahead@2` which caps at jest 29. Revisit when jest-expo relaxes the peer.
- **Web target**: SPEC §4/§6 defer web to v1.1. Web deps (`react-native-web`, `react-dom`, `@expo/metro-runtime`) are installed to keep the option open and to allow layout eyeballing in a browser during dev. The two SPEC blockers remain — audio cache path and long-list perf — and must be resolved before web ships as a v1 target.
