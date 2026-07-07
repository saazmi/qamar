// Content pipeline entry. SPEC §8.6.
// Downloads/reads raw source files (Tanzil et al.), normalizes, splits per-surah,
// writes into src/content/. Generated files ARE committed (SPEC §8.6 reproducibility).
// Runs OFFLINE at build time only — app never fetches text at runtime.

async function main(): Promise<void> {
  throw new Error('not implemented — Phase 1 (SPEC §25)');
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
