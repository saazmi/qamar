# Contributing to Qamar

Thanks for your interest. Please read [SPEC.md](SPEC.md) before opening a PR — it is the single source of truth.

## Ground rules

- **ADHD doctrine review** (SPEC §15): every PR that adds UI must state, in its description, how it complies — choices ≤3, taps ≤2, no backlog surfacing, undo-not-confirm.
- **hifz-core purity** (SPEC §28.2): no React, RN, or IO imports inside `src/core/hifz/`. Public API changes require a spec-update PR first.
- **Quranic text integrity is sacred** (SPEC §28.1): never hand-edit generated content files; all changes flow through the pipeline + verifier.
- **Copy tone** (SPEC §28.4): all French strings — warm, brief, zero guilt.

## Workflow

1. Fork, branch (`feat/…`, `fix/…`, `chore/…`).
2. Conventional commits, one concept per commit, English commit messages.
3. `npm run lint && npm run typecheck && npm test` must pass.
4. Open PR against `main` with a filled-out description (link the SPEC section, ADHD-doctrine note if UI).

## Reporting issues

Open a GitHub issue. For content/licensing concerns, use the `content` label; for ADHD-doctrine violations, use the `doctrine` label.

## Code of Conduct

By participating you agree to the [Contributor Covenant](CODE_OF_CONDUCT.md).
