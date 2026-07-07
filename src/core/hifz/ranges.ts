// Range operations. SPEC §9.4. One call, one activity-log entry, one undo unit.

import type { AyahRecord, SurahId, AyahNumber } from './types';
import { setState } from './states';

export function applyRange(
  records: AyahRecord[],
  surah: SurahId,
  fromAyah: AyahNumber,
  toAyah: AyahNumber,
  target: 'none' | 'learning' | 'memorized',
  now: string,
): AyahRecord[] {
  const lo = Math.min(fromAyah, toAyah);
  const hi = Math.max(fromAyah, toAyah);
  let next = records;
  for (let a = lo; a <= hi; a++) {
    next = setState(next, surah, a, target, now);
  }
  return next;
}
