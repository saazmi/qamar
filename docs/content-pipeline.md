# Content Pipeline

How to regenerate `src/content/`. SPEC §8.6.

## Sources (TBD Phase 1)

- Arabic Imlaei — Tanzil.net
- Arabic Uthmani — Tanzil.net (optional, size permitting)
- French translation — Hamidullah (via Tanzil)
- Tajweed annotations — v1.1 spike (SPEC §8.3)

## Commands

```bash
npm run content:build   # regenerate src/content/
npm run content:verify  # invariants: 6236 total, per-surah counts, harakat heuristic
```

Generated files are committed. Never hand-edit them (SPEC §28.1).
