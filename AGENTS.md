# Working on Qamar

Notes for any AI agent working in this repo. Read this before the first change
of a session. `SPEC.md` says *what* to build; this file says *how the work is
done and handed over*. Most of it was carried over on 2026-11-18 from Iqraa
(Majaz, `C:\Users\samia\iqraa\AGENTS.md`), where each rule was learned the hard
way; SPEC.md already says Iqraa's conventions apply where it is silent.

More than one agent may work here (Claude Code, Codex), and Sami moves between
two machines. This file is the contract they share. When you learn something
here the hard way, add it.

---

## Where things stand

**Rewrite this whenever the state changes**; a stale one misleads whoever opens
the repo next. Last updated 2026-11-18.

- Version 0.0.1, `main` only, last commit 2026-08-16 (recitations moved to a
  source with a real licence grant). Nothing on a branch.
- Built: content pipeline, `hifz-core`, reading view (states, notes in text or
  handwriting, per-ayah and continuous audio with basmalah), the three flow
  modes (free, revision reminder, assisted planning), Today cards and the
  review session player, an installable offline PWA for Cloudflare Pages.
- Stubs: dashboard, onboarding, the notes browser. SPEC §25 has the phases,
  §26 the v1.0 checklist.
- The working tree has a `package-lock.json` change (only `libc` fields
  removed, from an `npm install` on a different npm). Not committed.

---

## 1. How the work flows

1. **A ticket for every piece of work.** Iqraa's work runs off a Trello board
   (Backlog → On going tasks → Local testing and fact checking → Done & hit
   prod). Qamar has no board yet: ask Sami before creating one. Once there is
   one, move the card as the work moves, and write each card so it stands
   alone (what was seen and by whom, what was measured, the files, what is
   still unknown).
2. **When the implementation is done**, say in the same reply **how to test it
   by hand**: the route through the app, what to look at, what counts as
   correct.
3. **Wait.** Sami confirms it on a real device.
4. **Only then** commit, push and merge, and only when he says so
   (`commit push`, `cpm`, or the equivalent).

### Never push or merge on your own initiative

"Typecheck and tests pass" is not "it is right". Previews in a desktop browser
have repeatedly missed what only showed on his phone. **Every push to `main`
redeploys the web build** (`docs/deploy-web.md`), so merging is shipping.

### Close every substantial turn with three parts

```
## What I did
## What you need to do
## What's next
```

Short, at the end. "What you need to do" holds only real asks (decisions,
commands to run, things to look at on a device); say "nothing" when there is
nothing. "What's next" is the obvious next step, not a backlog dump. Skip it
for one-line answers.

### How to talk with Sami

- In discussions: a few lines per point, no essays, one question at most.
- In design iterations: propose the details and wait for his OK before
  touching code.
- When a design element is fixed, show his reference next to the new render,
  the same crop, without being asked.

### Two machines

On arriving at one:

```bash
git fetch --prune --prune-tags && git pull && npm install
```

**Do not skip `npm install`**: a pull that moves `package.json` leaves
`node_modules` behind silently. `npx expo install --check` says whether the
installed packages match the SDK. Before leaving a machine, everything goes to
the remote: nothing lives only in a working tree or a stash.

---

## 2. Do not claim it works until you have checked it works

- **Measure, don't eyeball.** Read positions, computed styles and contrast
  ratios from the DOM rather than judging a screenshot.
- **Sami's computer is a 1533 × 826 page**: a 1080p monitor at 125 %. His
  screenshots are in device pixels; divide by 1.25. Measure desktop layouts at
  1533 × 826, and phone layouts at **360 × 760** (his Android).
- **Say what you verified and what you did not.** A fix reasoned from the code
  is not a fix seen working; say which it is. A correction is cheaper than a
  wrong claim.
- **A device bug needs a device measurement** (Chrome over USB,
  `chrome://inspect`) before a fix. Two plausible fixes reasoned from the code
  are not a diagnosis.
- **A hidden browser pane runs no `requestAnimationFrame`, no `ResizeObserver`
  callbacks, and timers about once a second.** An animation that "doesn't
  move", a layout stuck on its fallback, or every screen taking ~1 s there is
  the pane, not the app. Bring it forward, or measure in headless Chrome on a
  production export (`npm run export:web`). Close headless browsers properly:
  kill every process whose command line names the run's `--user-data-dir`,
  then delete that folder.
- **Web is not the device.** Chromium, the phone's Chrome and React Native
  differ (bidi in mixed Arabic/Latin, SVG transforms). When something is
  reported on a device and you cannot reproduce it, believe the report and ask
  which build it was seen on.
- **Metro serves the working tree, not a branch.** Switching branches changes
  what Sami's running dev server shows. Say so before you switch, or use a
  `git worktree`.
- **A dev server running for a day can lag the whole app.** Before diagnosing
  lag, check the `node` process's CPU while the app is idle and restart it if
  it is busy.

---

## 3. Traps of the stack (Expo, React Native Web, NativeWind)

Met in Iqraa, on the same stack:

- **`className` on an `Animated.*` component is ignored.** Style it inline.
- **The function form of `style` is dropped** on a component that also has a
  `className`. Use `active:` classes for press feedback.
- **An array `style` beside a `className` on a `Pressable` throws on web.**
  Spread it into one object.
- **A layout chosen from `onLayout` is wrong for its first frame.** Start a
  width from a calculation and let the measurement only confirm it.
- **Inline `fontSize` bypasses the type scale.** Use the `text-*` classes.
- **Touch targets: 44pt minimum.** Branch layouts on available width, not on
  "is this a tablet".
- **Colour:** body text clears AA (4.5:1) in every theme; distinguish by hue,
  not only lightness; explicit tokens per theme rather than alpha washes.
- **Arabic and bidi:** never let bidi place a UI mark (draw markers as their
  own `View`); keep counts whole with non-breaking spaces; two Arabic words
  with only a neutral between them read as one RTL run. A coloured span inside
  a joined Arabic word does not colour correctly on the web: draw each run as
  its own text, with a zero-width joiner on both sides of every cut between
  joining letters.

---

## 4. Conventions

### The Qur'an's text, its translations, and hadith

SPEC §28.1 holds the text itself: never hand-edit generated content; all
changes go through the pipeline and `npm run content:verify`.

Sami's rule, 2026-10-18, after hadith quoted from memory shipped in Iqraa:
**"never put a hadith or verse in prod if you're not 100% sure of the reference
+ always have an agent confirm and another one challenge… for hadiths only
authentic ones."**

- The reference is exact and checkable: sura:verse; for a hadith, collection
  and number (a sunnah.com link). The text is checked against the source,
  letter by letter where a script can.
- Hadith: sahih only. None quoted from memory.
- Two agents with separate briefs: one confirms at the source, one tries to
  refute reference, text, grading and use. Anything still in doubt stays out.
- **A translation is only quoted if its licence allows it**, credited where it
  is shown. Hamidullah and Saheeh International are copyrighted and were taken
  out of Iqraa for that reason (it now quotes QuranEnc).

### Comments explain why, with numbers

Record the alternative that was rejected and the measurement that settled it,
not what the code does. Never leave a comment asserting something you did not
verify; write "reported, not reproduced" when that is what it is.

### Commits

Conventional Commits, with a prose body explaining *why*. Subject plain,
concrete, lowercase after the colon, no trailing full stop; look at `git log`
first. Split by concern. Typecheck each commit in a series, not only the tip.
End with the `Co-Authored-By:` line your harness gives you.

### Branches

Work on a branch off `main`, never on `main` itself, not even for two lines.
Merge with `--no-ff` and a descriptive message, then delete the branch once
`git merge-base --is-ancestor <branch> main` confirms `main` holds it.

Git's scripting traps: `git merge -F -` does not read stdin (write the message
to a file). `set -e` does not stop at a failure inside `a && b`; check that
the merge commit exists (`git log -1`) before tagging anything.

### Gates

Before saying anything is done, the same checks CI runs:

```bash
npm run lint && npm run typecheck && npm test && npm run content:verify
```

When a test that encodes a rule fails, read its header before "fixing" the
test.

### Housekeeping

- Throwaway scripts and analyses go in the scratchpad, not the repo.
- Dev servers through the preview tooling, never a bare `npm start` in the
  background. Stop what you started; don't kill a server you did not start
  without asking (it is probably Sami's).

---

## 5. Versioning

`MAJOR.MINOR.PATCH`, measuring **what a learner notices**:

| what shipped | bump |
|---|---|
| bug fixes only | PATCH |
| any feature or enhancement a learner would see | MINOR |
| you would write a sentence to users about it | MAJOR |
| dependencies, tooling, docs, tests | none |

Effort is not the axis. Bump on the branch (`chore(release): X.Y.Z — …` as
its last commit), then the `--no-ff` merge, then an annotated tag on the merge
commit with a one-line, lowercase message in the learner's terms.
`npm version X.Y.Z --no-git-tag-version` updates `package.json` and the lock;
`app.json`'s `expo.version` is by hand. Leave `versionCode`/`buildNumber` to
EAS and do not guess at `runtimeVersion`. Do not bump MAJOR without being told.
