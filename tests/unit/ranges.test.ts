// SPEC §9.4.

import { applyRange } from '@core/hifz/ranges';
import { getState } from '@core/hifz/states';

const T0 = '2026-01-01T00:00:00.000Z';

describe('applyRange', () => {
  it('marks 1..15 memorized in one call', () => {
    const next = applyRange([], 67, 1, 15, 'memorized', T0);
    expect(next).toHaveLength(15);
    expect(next.every((r) => r.state === 'memorized')).toBe(true);
  });

  it('accepts reversed bounds', () => {
    const next = applyRange([], 1, 5, 1, 'learning', T0);
    expect(next.map((r) => r.ayah).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('single-ayah range', () => {
    const next = applyRange([], 1, 3, 3, 'memorized', T0);
    expect(next).toHaveLength(1);
    expect(next[0]!.ayah).toBe(3);
  });

  it('overlays onto existing records', () => {
    const learning = applyRange([], 2, 1, 10, 'learning', T0);
    const memorized = applyRange(learning, 2, 5, 8, 'memorized', T0);
    expect(getState(memorized, 2, 4)).toBe('learning');
    expect(getState(memorized, 2, 7)).toBe('memorized');
    expect(getState(memorized, 2, 9)).toBe('learning');
  });

  it('target=none deletes rows in range', () => {
    const memorized = applyRange([], 3, 1, 5, 'memorized', T0);
    const cleared = applyRange(memorized, 3, 2, 4, 'none', T0);
    expect(cleared.map((r) => r.ayah).sort((a, b) => a - b)).toEqual([1, 5]);
  });
});
