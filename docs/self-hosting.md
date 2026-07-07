# Self-Hosting / Forking

Qamar is MIT-licensed (code) and free/ad-free/tracker-free by design.
SPEC §2, §24.

## Fork checklist

1. Rename in `app.json` (`expo.name`, `expo.slug`, `expo.ios.bundleIdentifier`, `expo.android.package`).
2. Update the display-name i18n key `app.name` in `src/i18n/locales/*.json`.
3. Review `LICENSE-CONTENT` — the bundled datasets carry their own licenses; comply with each.
4. Regenerate `src/content/` via `npm run content:build` if you change source editions.
