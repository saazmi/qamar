# Qamar

> Offline-first Quran memorization (hifz) app designed for ADHD learners.

**Codename in SPEC**: Rusookh. **Display name**: **Qamar** (قمر). The display name lives only in `app.json` and a single i18n string per SPEC §1.

## What this is

An offline-first mobile app that helps people with ADHD memorize the Quran by making progress visible, sessions short, states simple, and revision automatic. Full Quran text bundled offline; per-verse memorization tracking; chunk-based revision scheduler; French translation; per-ayah audio (stream + cache).

See [SPEC.md](SPEC.md) — the single source of truth for what, why, and how.

## Status

**Phase 0 — Foundations.** Repo scaffold only. No feature implementation yet. See SPEC §25 for the roadmap.

## Stack

Expo (React Native) · TypeScript · Expo Router · NativeWind · Zustand · expo-sqlite · expo-av · FlashList. See SPEC §6.

## Development

```bash
npm install
npm run start
```

Requires Node LTS + Expo CLI. iOS/Android targets (web in v1.1).

## License

- **Code**: MIT — see [LICENSE](LICENSE).
- **Content** (Quran text editions, translations, tajweed data, audio, fonts): third-party datasets under their own licenses. See [LICENSE-CONTENT](LICENSE-CONTENT).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Conventional commits. Every UI PR must state ADHD-doctrine compliance (SPEC §15).
