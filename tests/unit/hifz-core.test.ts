// hifz-core smoke exports test. Detailed tests in the per-module *.test.ts files.
// SPEC §22, §26 — 100% branch-coverage target.

import * as core from '@core/hifz';

describe('hifz-core public API surface', () => {
  it('re-exports states, ranges, chunks, scheduler, aggregates', () => {
    expect(typeof core.getState).toBe('function');
    expect(typeof core.setState).toBe('function');
    expect(typeof core.applyRange).toBe('function');
    expect(typeof core.deriveChunks).toBe('function');
    expect(typeof core.dueChunks).toBe('function');
    expect(typeof core.markReviewed).toBe('function');
    expect(typeof core.overallProgress).toBe('function');
    expect(core.LADDER_DAYS).toEqual([1, 3, 7, 14, 30, 60]);
  });
});
