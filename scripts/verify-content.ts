// Content verifier — runs in CI. SPEC §8.1, §22.
// Asserts: 6236 ayat total; per-surah counts vs hardcoded table; harakat presence
// heuristic; translation/text alignment (same ayah counts per surah).

const HARDCODED_TOTAL = 6236;
const HARDCODED_SURAH_COUNTS: readonly number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53,
  89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12,
  12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26,
  30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

async function main(): Promise<void> {
  if (HARDCODED_SURAH_COUNTS.length !== 114) throw new Error('surah table length mismatch');
  const sum = HARDCODED_SURAH_COUNTS.reduce((a, b) => a + b, 0);
  if (sum !== HARDCODED_TOTAL) throw new Error(`ayah total ${sum} != ${HARDCODED_TOTAL}`);
  // TODO Phase 1: read src/content/text/*.json, compare, harakat heuristic, translation align.
  console.warn('verify-content: table OK; content checks pending (Phase 1)');
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
