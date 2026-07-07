// SPEC §14.1.

import { deriveChunks } from '@core/hifz/chunks';
import { applyRange } from '@core/hifz/ranges';
import { setState } from '@core/hifz/states';
import type { AyahIndex } from '@core/hifz/types';
import { keyOf } from '@core/hifz/types';

const T0 = '2026-01-01T00:00:00.000Z';

const indexPages = (
  entries: Array<{ surah: number; ayah: number; page: number; juz?: number }>,
): AyahIndex => {
  const idx: AyahIndex = {};
  for (const e of entries) {
    idx[keyOf(e.surah, e.ayah)] = { juz: e.juz ?? 1, hizbQuarter: 1, page: e.page };
  }
  return idx;
};

const samePageIdx = (surah: number, from: number, to: number, page = 1): AyahIndex => {
  const entries = [];
  for (let a = from; a <= to; a++) entries.push({ surah, ayah: a, page });
  return indexPages(entries);
};

describe('deriveChunks', () => {
  it('empty records → no chunks', () => {
    expect(deriveChunks([], {})).toEqual([]);
  });

  it('ignores learning-state records', () => {
    const recs = applyRange([], 1, 1, 5, 'learning', T0);
    expect(deriveChunks(recs, samePageIdx(1, 1, 5))).toEqual([]);
  });

  it('single contiguous run on one page → one chunk', () => {
    const recs = applyRange([], 67, 1, 15, 'memorized', T0);
    const chunks = deriveChunks(recs, samePageIdx(67, 1, 15));
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.startAyah).toBe(1);
    expect(chunks[0]!.endAyah).toBe(15);
  });

  it('splits at page boundaries', () => {
    const recs = applyRange([], 2, 1, 10, 'memorized', T0);
    const idx: AyahIndex = {};
    for (let a = 1; a <= 5; a++) idx[keyOf(2, a)] = { juz: 1, hizbQuarter: 1, page: 1 };
    for (let a = 6; a <= 10; a++) idx[keyOf(2, a)] = { juz: 1, hizbQuarter: 1, page: 2 };
    const chunks = deriveChunks(recs, idx);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]!.endAyah).toBe(5);
    expect(chunks[1]!.startAyah).toBe(6);
  });

  it('splits when non-memorized ayah interrupts', () => {
    let recs = applyRange([], 1, 1, 7, 'memorized', T0);
    recs = setState(recs, 1, 4, 'learning', T0);
    const chunks = deriveChunks(recs, samePageIdx(1, 1, 7));
    expect(chunks.map((c) => [c.startAyah, c.endAyah])).toEqual([
      [1, 3],
      [5, 7],
    ]);
  });

  it('splits across surahs', () => {
    let recs = applyRange([], 1, 1, 3, 'memorized', T0);
    recs = applyRange(recs, 2, 1, 3, 'memorized', T0);
    const idx: AyahIndex = {
      ...samePageIdx(1, 1, 3),
      ...samePageIdx(2, 1, 3, 2),
    };
    const chunks = deriveChunks(recs, idx);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]!.surah).toBe(1);
    expect(chunks[1]!.surah).toBe(2);
  });

  it('reviewCount and lastReviewedAt aggregate correctly across a chunk', () => {
    const recs = applyRange([], 1, 1, 3, 'memorized', T0);
    const T1 = '2026-01-02T00:00:00.000Z';
    const T2 = '2026-01-03T00:00:00.000Z';
    // Mutate ayah 2's review data to be more advanced than ayahs 1 and 3.
    const mutated = recs.map((r) =>
      r.ayah === 2
        ? { ...r, reviewCount: 3, lastReviewedAt: T2, ladderOffset: -1 }
        : { ...r, reviewCount: 1, lastReviewedAt: T1 },
    );
    const chunks = deriveChunks(mutated, samePageIdx(1, 1, 3));
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.minReviewCount).toBe(1);
    expect(chunks[0]!.minLadderOffset).toBe(-1);
    expect(chunks[0]!.lastReviewedAt).toBe(T2);
  });

  it('falls back to 15-ayah windows when page data absent', () => {
    const recs = applyRange([], 5, 1, 40, 'memorized', T0);
    const chunks = deriveChunks(recs, {});
    expect(chunks).toHaveLength(3);
    expect(chunks[0]!.startAyah).toBe(1);
    expect(chunks[0]!.endAyah).toBe(15);
    expect(chunks[1]!.startAyah).toBe(16);
    expect(chunks[1]!.endAyah).toBe(30);
    expect(chunks[2]!.startAyah).toBe(31);
    expect(chunks[2]!.endAyah).toBe(40);
  });
});
