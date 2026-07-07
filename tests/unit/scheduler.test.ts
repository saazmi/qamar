// SPEC §14.2–14.4.

import { applyRange } from '@core/hifz/ranges';
import { deriveChunks } from '@core/hifz/chunks';
import {
  LADDER_DAYS,
  dueChunks,
  intervalDaysFor,
  isDue,
  ladderIndexFor,
  markReviewed,
  overdueDaysFor,
} from '@core/hifz/scheduler';
import type { AyahIndex, AyahRecord } from '@core/hifz/types';
import { keyOf } from '@core/hifz/types';

const daysAgo = (base: string, n: number): string =>
  new Date(Date.parse(base) - n * 86400000).toISOString();

const idxFor = (surah: number, from: number, to: number, page = 1): AyahIndex => {
  const idx: AyahIndex = {};
  for (let a = from; a <= to; a++) {
    idx[keyOf(surah, a)] = { juz: 1, hizbQuarter: 1, page };
  }
  return idx;
};

const NOW = '2026-03-01T00:00:00.000Z';

describe('LADDER_DAYS', () => {
  it('matches spec ladder', () => {
    expect(LADDER_DAYS).toEqual([1, 3, 7, 14, 30, 60]);
  });
});

describe('ladderIndexFor / intervalDaysFor', () => {
  it('index caps at 5 (60 days)', () => {
    const recs: AyahRecord[] = [
      {
        surah: 1,
        ayah: 1,
        state: 'memorized',
        updatedAt: NOW,
        memorizedAt: NOW,
        reviewCount: 99,
        ladderOffset: 0,
      },
    ];
    const chunk = deriveChunks(recs, idxFor(1, 1, 1))[0]!;
    expect(ladderIndexFor(chunk)).toBe(5);
    expect(intervalDaysFor(chunk)).toBe(60);
  });

  it('floors at 0 when ladderOffset exceeds reviewCount', () => {
    const recs: AyahRecord[] = [
      {
        surah: 1,
        ayah: 1,
        state: 'memorized',
        updatedAt: NOW,
        memorizedAt: NOW,
        reviewCount: 1,
        ladderOffset: -10,
      },
    ];
    const chunk = deriveChunks(recs, idxFor(1, 1, 1))[0]!;
    expect(ladderIndexFor(chunk)).toBe(0);
  });
});

describe('due logic', () => {
  it('never-reviewed chunk becomes due after 1 day', () => {
    const memAt = daysAgo(NOW, 2);
    const recs = applyRange([], 1, 1, 3, 'memorized', memAt);
    const chunks = deriveChunks(recs, idxFor(1, 1, 3));
    expect(isDue(chunks[0]!, NOW)).toBe(true);
    expect(overdueDaysFor(chunks[0]!, NOW)).toBeCloseTo(1, 5);
  });

  it('recently reviewed chunk is not due', () => {
    let recs = applyRange([], 1, 1, 3, 'memorized', daysAgo(NOW, 30));
    const c0 = deriveChunks(recs, idxFor(1, 1, 3))[0]!;
    recs = markReviewed(recs, c0, 'ok', daysAgo(NOW, 0.5));
    const chunk = deriveChunks(recs, idxFor(1, 1, 3))[0]!;
    expect(isDue(chunk, NOW)).toBe(false);
  });
});

describe('dueChunks daily budget', () => {
  it('returns at most N chunks, most-overdue first', () => {
    let recs: AyahRecord[] = [];
    const idx: AyahIndex = {};
    for (let s = 1; s <= 5; s++) {
      recs = applyRange(recs, s, 1, 3, 'memorized', daysAgo(NOW, s + 1));
      for (let a = 1; a <= 3; a++) idx[keyOf(s, a)] = { juz: 1, hizbQuarter: 1, page: s };
    }
    const due = dueChunks(recs, idx, { dailyBudget: 3, now: NOW });
    expect(due).toHaveLength(3);
    expect(due[0]!.surah).toBe(5);
    expect(due[1]!.surah).toBe(4);
    expect(due[2]!.surah).toBe(3);
  });

  it('returns empty array when budget is 0', () => {
    const recs = applyRange([], 1, 1, 3, 'memorized', daysAgo(NOW, 10));
    expect(dueChunks(recs, idxFor(1, 1, 3), { dailyBudget: 0, now: NOW })).toEqual([]);
  });

  it('treats negative budget as 0', () => {
    const recs = applyRange([], 1, 1, 3, 'memorized', daysAgo(NOW, 10));
    expect(dueChunks(recs, idxFor(1, 1, 3), { dailyBudget: -5, now: NOW })).toEqual([]);
  });
});

describe('markReviewed', () => {
  it('OK increments reviewCount and stamps lastReviewedAt', () => {
    let recs = applyRange([], 1, 1, 3, 'memorized', daysAgo(NOW, 10));
    const chunk = deriveChunks(recs, idxFor(1, 1, 3))[0]!;
    recs = markReviewed(recs, chunk, 'ok', NOW);
    for (const r of recs) {
      expect(r.reviewCount).toBe(1);
      expect(r.lastReviewedAt).toBe(NOW);
    }
  });

  it('Hard demotes via ladderOffset without changing reviewCount', () => {
    let recs = applyRange([], 1, 1, 3, 'memorized', daysAgo(NOW, 100));
    let chunk = deriveChunks(recs, idxFor(1, 1, 3))[0]!;
    recs = markReviewed(recs, chunk, 'ok', daysAgo(NOW, 50));
    chunk = deriveChunks(recs, idxFor(1, 1, 3))[0]!;
    recs = markReviewed(recs, chunk, 'ok', daysAgo(NOW, 20));
    chunk = deriveChunks(recs, idxFor(1, 1, 3))[0]!;
    expect(chunk.minReviewCount).toBe(2);
    recs = markReviewed(recs, chunk, 'hard', NOW);
    const after = recs[0]!;
    expect(after.reviewCount).toBe(2);
    expect(after.ladderOffset).toBe(-1);
    const nextChunk = deriveChunks(recs, idxFor(1, 1, 3))[0]!;
    expect(intervalDaysFor(nextChunk)).toBe(LADDER_DAYS[1]);
  });

  it('Hard clamps ladderOffset so effective index stays ≥ 0', () => {
    let recs = applyRange([], 1, 1, 1, 'memorized', daysAgo(NOW, 200));
    let chunk = deriveChunks(recs, idxFor(1, 1, 1))[0]!;
    for (let i = 0; i < 5; i++) {
      recs = markReviewed(recs, chunk, 'hard', NOW);
      chunk = deriveChunks(recs, idxFor(1, 1, 1))[0]!;
    }
    expect(chunk.minLadderOffset).toBe(0);
    expect(ladderIndexFor(chunk)).toBe(0);
  });

  it('only touches ayat inside the given chunk', () => {
    let recs = applyRange([], 1, 1, 6, 'memorized', daysAgo(NOW, 10));
    const idx: AyahIndex = {};
    for (let a = 1; a <= 3; a++) idx[keyOf(1, a)] = { juz: 1, hizbQuarter: 1, page: 1 };
    for (let a = 4; a <= 6; a++) idx[keyOf(1, a)] = { juz: 1, hizbQuarter: 1, page: 2 };
    const chunks = deriveChunks(recs, idx);
    recs = markReviewed(recs, chunks[0]!, 'ok', NOW);
    const inChunk = recs.find((r) => r.ayah === 2)!;
    const outChunk = recs.find((r) => r.ayah === 5)!;
    expect(inChunk.lastReviewedAt).toBe(NOW);
    expect(outChunk.lastReviewedAt).toBeUndefined();
  });
});
