// Chunk derivation. SPEC §14.1. Recomputed from records on demand, never stored.
// A chunk = contiguous run of `memorized` ayat within one surah, merged from
// adjacent records, then split at Madani page boundaries. 15-ayah windows as
// fallback where page data is absent.

import type { AyahRecord, AyahIndex, Chunk, SurahId } from './types';
import { keyOf } from './types';

const FALLBACK_WINDOW = 15;

function pageOf(index: AyahIndex, surah: SurahId, ayah: number): number | undefined {
  return index[keyOf(surah, ayah)]?.page;
}

function maxIso(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function minIso(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function finalizeChunk(members: AyahRecord[]): Chunk {
  const first = members[0]!;
  const last = members[members.length - 1]!;
  let lastReviewedAt: string | undefined;
  let memorizedAt: string | undefined;
  let minReviewCount = Infinity;
  let minLadderOffset = Infinity;
  for (const m of members) {
    lastReviewedAt = maxIso(lastReviewedAt, m.lastReviewedAt);
    memorizedAt = minIso(memorizedAt, m.memorizedAt ?? m.updatedAt);
    if (m.reviewCount < minReviewCount) minReviewCount = m.reviewCount;
    if (m.ladderOffset < minLadderOffset) minLadderOffset = m.ladderOffset;
  }
  return {
    surah: first.surah,
    startAyah: first.ayah,
    endAyah: last.ayah,
    lastReviewedAt,
    memorizedAt: memorizedAt ?? first.updatedAt,
    minReviewCount: minReviewCount === Infinity ? 0 : minReviewCount,
    minLadderOffset: minLadderOffset === Infinity ? 0 : minLadderOffset,
  };
}

export function deriveChunks(records: AyahRecord[], ayahIndex: AyahIndex): Chunk[] {
  const memorized = records
    .filter((r) => r.state === 'memorized')
    .slice()
    .sort((a, b) => (a.surah - b.surah) || (a.ayah - b.ayah));

  const chunks: Chunk[] = [];
  let run: AyahRecord[] = [];

  const flush = () => {
    if (!run.length) return;
    chunks.push(finalizeChunk(run));
    run = [];
  };

  for (const rec of memorized) {
    if (!run.length) {
      run.push(rec);
      continue;
    }
    const prev = run[run.length - 1]!;
    const contiguous = prev.surah === rec.surah && prev.ayah + 1 === rec.ayah;
    const prevPage = pageOf(ayahIndex, prev.surah, prev.ayah);
    const recPage = pageOf(ayahIndex, rec.surah, rec.ayah);
    const samePage =
      contiguous && prevPage !== undefined && recPage !== undefined && prevPage === recPage;
    const pageAbsent = contiguous && prevPage === undefined && recPage === undefined;
    const fallbackFull = pageAbsent && run.length >= FALLBACK_WINDOW;

    if (contiguous && (samePage || (pageAbsent && !fallbackFull))) {
      run.push(rec);
    } else {
      flush();
      run.push(rec);
    }
  }
  flush();

  return chunks;
}
