// Range operations. SPEC §9.4. One call, one activity-log entry, one undo unit.

import type { AyahRecord, SurahId, AyahNumber } from './types';

export function applyRange(
  _records: AyahRecord[],
  _surah: SurahId,
  _fromAyah: AyahNumber,
  _toAyah: AyahNumber,
  _target: 'none' | 'learning' | 'memorized',
  _now: string,
): AyahRecord[] {
  throw new Error('not implemented — Phase 2 (SPEC §25)');
}
