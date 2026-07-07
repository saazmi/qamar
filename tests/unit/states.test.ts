// SPEC §9.1–9.3.

import { getState, setState } from '@core/hifz/states';
import type { AyahRecord } from '@core/hifz/types';

const T0 = '2026-01-01T00:00:00.000Z';
const T1 = '2026-01-02T00:00:00.000Z';
const T2 = '2026-01-03T00:00:00.000Z';

const rec = (over: Partial<AyahRecord> = {}): AyahRecord => ({
  surah: 1,
  ayah: 1,
  state: 'learning',
  updatedAt: T0,
  reviewCount: 0,
  ladderOffset: 0,
  ...over,
});

describe('getState', () => {
  it('returns none when no record', () => {
    expect(getState([], 1, 1)).toBe('none');
  });
  it('returns persisted state', () => {
    expect(getState([rec({ state: 'memorized' })], 1, 1)).toBe('memorized');
  });
});

describe('setState transitions', () => {
  it('none → learning creates record', () => {
    const next = setState([], 1, 1, 'learning', T0);
    expect(next).toHaveLength(1);
    expect(next[0]!.state).toBe('learning');
    expect(next[0]!.memorizedAt).toBeUndefined();
    expect(next[0]!.reviewCount).toBe(0);
    expect(next[0]!.ladderOffset).toBe(0);
  });

  it('none → memorized stamps memorizedAt', () => {
    const next = setState([], 1, 1, 'memorized', T0);
    expect(next[0]!.memorizedAt).toBe(T0);
    expect(next[0]!.state).toBe('memorized');
  });

  it('learning → memorized stamps memorizedAt first time', () => {
    const a = setState([], 1, 1, 'learning', T0);
    const b = setState(a, 1, 1, 'memorized', T1);
    expect(b[0]!.memorizedAt).toBe(T1);
  });

  it('memorized → learning keeps memorizedAt', () => {
    const a = setState([], 1, 1, 'memorized', T0);
    const b = setState(a, 1, 1, 'learning', T1);
    expect(b[0]!.memorizedAt).toBe(T0);
    expect(b[0]!.state).toBe('learning');
    expect(b[0]!.updatedAt).toBe(T1);
  });

  it('memorized → learning → memorized keeps original memorizedAt', () => {
    let s = setState([], 1, 1, 'memorized', T0);
    s = setState(s, 1, 1, 'learning', T1);
    s = setState(s, 1, 1, 'memorized', T2);
    expect(s[0]!.memorizedAt).toBe(T0);
  });

  it('any → none deletes row', () => {
    const a = setState([], 1, 1, 'memorized', T0);
    const b = setState(a, 1, 1, 'none', T1);
    expect(b).toHaveLength(0);
  });

  it('none → none is a no-op', () => {
    const next = setState([], 1, 1, 'none', T0);
    expect(next).toEqual([]);
  });

  it('preserves reviewCount and ladderOffset across state flip', () => {
    const existing = rec({ state: 'memorized', reviewCount: 3, ladderOffset: -1, memorizedAt: T0 });
    const next = setState([existing], 1, 1, 'learning', T1);
    expect(next[0]!.reviewCount).toBe(3);
    expect(next[0]!.ladderOffset).toBe(-1);
  });

  it('is immutable — original array unchanged', () => {
    const src: AyahRecord[] = [];
    setState(src, 1, 1, 'learning', T0);
    expect(src).toEqual([]);
  });
});
