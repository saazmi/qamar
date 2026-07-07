// Revision scheduler. SPEC §14.2–14.4. Ladder: 1 → 3 → 7 → 14 → 30 → 60 days.

import type { AyahRecord, AyahIndexEntry, Chunk, SchedulerSettings } from './types';

export const LADDER_DAYS = [1, 3, 7, 14, 30, 60] as const;

export function dueChunks(
  _records: AyahRecord[],
  _ayahIndex: Record<string, AyahIndexEntry>,
  _settings: SchedulerSettings,
): Chunk[] {
  throw new Error('not implemented — Phase 2 (SPEC §25)');
}

export function markReviewed(
  _records: AyahRecord[],
  _chunk: Chunk,
  _outcome: 'ok' | 'hard',
  _now: string,
): AyahRecord[] {
  throw new Error('not implemented — Phase 2 (SPEC §25)');
}
