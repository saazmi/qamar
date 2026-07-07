# Content Pipeline

How to regenerate `src/content/`. SPEC §8.6.

## Sources (Phase 1, resolved 2026-07-07)

- **Arabic Imlaei** — Tanzil `quran-simple` (Imlaei with tashkeel/harakat), via `api.alquran.cloud` at build time
- **French translation** — Tanzil `fr.hamidullah` (Muhammad Hamidullah), via `api.alquran.cloud`
- **Uthmani** — not bundled in v1 (owner decision D2)
- **Tajweed annotations** — v1.1, spike-gated (SPEC §8.3, D5 low-priority)

## Commands

```bash
npm run content:build    # fetch + normalize into src/content/
npm run content:verify   # 6236 total, per-surah counts, harakat heuristic, alignment
```

## Output layout

```
src/content/
├── structure.json                # 114 SurahMeta records
├── ayah-index.json               # 6236 (surah:ayah) → {juz, hizbQuarter, page}
├── text/{001..114}.json          # per-surah Arabic Imlaei with harakat
└── translation-fr/{001..114}.json  # per-surah French Hamidullah
```

Total footprint ≈ 3.6 MB.

## Caching

Raw upstream responses cache under `scripts/.cache/` (gitignored). Delete
that folder to force a fresh fetch on the next `content:build`.

## Discipline

Generated files under `src/content/` **are committed** — reproducibility
and offline builds (SPEC §8.6). **Never hand-edit them** (SPEC §28.1).
All changes flow through the pipeline + verifier.
