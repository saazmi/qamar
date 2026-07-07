// SPEC §9.5.

import { applyRange } from '@core/hifz/ranges';
import { setState } from '@core/hifz/states';
import {
  juzProgress,
  overallProgress,
  surahProgress,
} from '@core/hifz/aggregates';
import type { AyahIndex } from '@core/hifz/types';
import { keyOf } from '@core/hifz/types';

const NOW = '2026-01-10T00:00:00.000Z';
const T0 = '2026-01-01T00:00:00.000Z';

const idxFor = (surah: number, from: number, to: number, juz = 1): AyahIndex => {
  const idx: AyahIndex = {};
  for (let a = from; a <= to; a++) idx[keyOf(surah, a)] = { juz, hizbQuarter: 1, page: 1 };
  return idx;
};

describe('surahProgress', () => {
  it('counts memorized and learning correctly', () => {
    let recs = applyRange([], 1, 1, 5, 'memorized', T0);
    recs = setState(recs, 1, 6, 'learning', T0);
    const p = surahProgress(recs, idxFor(1, 1, 7), NOW, 1, 7);
    expect(p.memorized).toBe(5);
    expect(p.learning).toBe(1);
    expect(p.total).toBe(7);
    expect(p.percent).toBeCloseTo(5 / 7, 5);
  });

  it('returns zeros for a surah with no records', () => {
    const p = surahProgress([], {}, NOW, 5, 30);
    expect(p).toEqual({ memorized: 0, learning: 0, needsReview: 0, total: 30, percent: 0 });
  });

  it('ignores records from other surahs', () => {
    const recs = applyRange([], 2, 1, 5, 'memorized', T0);
    const p = surahProgress(recs, idxFor(2, 1, 5), NOW, 1, 7);
    expect(p.memorized).toBe(0);
  });
});

describe('juzProgress', () => {
  it('counts across surahs sharing a juz', () => {
    let recs = applyRange([], 78, 1, 40, 'memorized', T0);
    recs = applyRange(recs, 79, 1, 20, 'memorized', T0);
    const idx: AyahIndex = { ...idxFor(78, 1, 40, 30), ...idxFor(79, 1, 46, 30) };
    const p = juzProgress(recs, idx, NOW, 30);
    expect(p.memorized).toBe(60);
    expect(p.total).toBe(86);
  });
});

describe('overallProgress', () => {
  it('percent respects custom total', () => {
    const recs = applyRange([], 114, 1, 3, 'memorized', T0);
    const p = overallProgress(recs, idxFor(114, 1, 3), NOW, 6);
    expect(p.memorized).toBe(3);
    expect(p.total).toBe(6);
    expect(p.percent).toBeCloseTo(0.5, 5);
  });

  it('needsReview counts ayat inside due chunks', () => {
    const memAt = new Date(Date.parse(NOW) - 5 * 86400000).toISOString();
    const recs = applyRange([], 1, 1, 3, 'memorized', memAt);
    const p = overallProgress(recs, idxFor(1, 1, 3), NOW, 3);
    expect(p.needsReview).toBe(3);
  });

  it('percent is 0 when total is 0', () => {
    const p = overallProgress([], {}, NOW, 0);
    expect(p.total).toBe(0);
    expect(p.percent).toBe(0);
  });
});
