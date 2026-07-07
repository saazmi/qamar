// Content verifier — runs in CI. SPEC §8.1, §22.
// Asserts against src/content/: 6236 ayat total; per-surah counts vs hardcoded
// table; harakat presence heuristic; text/translation alignment; structure size.

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'content');

const HARDCODED_TOTAL = 6236;
const HARDCODED_SURAH_COUNTS: readonly number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53,
  89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12,
  12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26,
  30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

// Unicode ranges for Arabic diacritics (harakat + tanwin + shadda + sukun + etc.)
const HARAKAT_RE = /[ً-ْٰۖ-ۜ۟-۪ۤۧۨ-ۭ]/;

function pad3(n: number): string {
  return n.toString().padStart(3, '0');
}

interface AyahText {
  ayah: number;
  text: string;
}

interface SurahMeta {
  id: number;
  ayahCount: number;
  nameArabic: string;
  nameFrench: string;
}

async function readJson<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, 'utf8');
  return JSON.parse(raw) as T;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const errors: string[] = [];
  const push = (msg: string) => errors.push(msg);

  if (HARDCODED_SURAH_COUNTS.length !== 114) {
    push(`hardcoded surah table has ${HARDCODED_SURAH_COUNTS.length} entries (want 114)`);
  }
  const tableSum = HARDCODED_SURAH_COUNTS.reduce((a, b) => a + b, 0);
  if (tableSum !== HARDCODED_TOTAL) {
    push(`hardcoded table sum ${tableSum} != ${HARDCODED_TOTAL}`);
  }

  const structurePath = path.join(CONTENT_DIR, 'structure.json');
  const indexPath = path.join(CONTENT_DIR, 'ayah-index.json');

  if (!(await fileExists(structurePath))) {
    console.warn('verify-content: content not built yet (run `npm run content:build`).');
    if (errors.length) throw new Error(errors.join('\n'));
    return;
  }

  const structure = await readJson<SurahMeta[]>(structurePath);
  if (structure.length !== 114) push(`structure.json has ${structure.length} surahs (want 114)`);

  const index = await readJson<Record<string, unknown>>(indexPath);
  const indexSize = Object.keys(index).length;
  if (indexSize !== HARDCODED_TOTAL) {
    push(`ayah-index has ${indexSize} entries (want ${HARDCODED_TOTAL})`);
  }

  let harakatChecked = 0;
  let harakatMissing = 0;

  for (let s = 1; s <= 114; s++) {
    const textPath = path.join(CONTENT_DIR, 'text', `${pad3(s)}.json`);
    const trPath = path.join(CONTENT_DIR, 'translation-fr', `${pad3(s)}.json`);
    const expected = HARDCODED_SURAH_COUNTS[s - 1]!;

    if (!(await fileExists(textPath))) {
      push(`missing text file for surah ${s}`);
      continue;
    }
    if (!(await fileExists(trPath))) {
      push(`missing translation file for surah ${s}`);
      continue;
    }

    const text = await readJson<AyahText[]>(textPath);
    const trans = await readJson<AyahText[]>(trPath);

    if (text.length !== expected) push(`surah ${s} text has ${text.length} ayat (want ${expected})`);
    if (trans.length !== expected) push(`surah ${s} trans has ${trans.length} ayat (want ${expected})`);

    if (text.length !== trans.length) {
      push(`surah ${s} text/translation misalignment: ${text.length} vs ${trans.length}`);
    }

    const meta = structure.find((m) => m.id === s);
    if (!meta) push(`structure missing surah ${s}`);
    else if (meta.ayahCount !== expected) {
      push(`structure surah ${s} ayahCount ${meta.ayahCount} != ${expected}`);
    }

    // Harakat sampling — check the middle ayah of each surah (avoids muqatta'at
    // opening letters which legitimately lack diacritics).
    const midIdx = Math.floor(text.length / 2);
    const midAyah = text[midIdx]!;
    harakatChecked += 1;
    if (!HARAKAT_RE.test(midAyah.text)) {
      harakatMissing += 1;
      push(`no harakat in ${s}:${midAyah.ayah} → "${midAyah.text.slice(0, 30)}…"`);
    }
  }

  if (errors.length) {
    console.error(`verify-content: ${errors.length} error(s)`);
    for (const e of errors.slice(0, 20)) console.error(`  - ${e}`);
    if (errors.length > 20) console.error(`  … and ${errors.length - 20} more`);
    process.exit(1);
  }

  console.log(
    `✓ verify-content: 114 surahs, ${HARDCODED_TOTAL} ayat, ${harakatChecked}/${harakatChecked} harakat-sample checks passed`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
