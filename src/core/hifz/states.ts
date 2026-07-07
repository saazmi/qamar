// State transitions. SPEC §9.1–9.3. Pure, undo-friendly (returns new snapshot).

import type { AyahRecord, AyahState, SurahId, AyahNumber } from './types';

export function getState(records: AyahRecord[], surah: SurahId, ayah: AyahNumber): AyahState {
  const r = records.find((x) => x.surah === surah && x.ayah === ayah);
  return r?.state ?? 'none';
}

export function setState(
  _records: AyahRecord[],
  _surah: SurahId,
  _ayah: AyahNumber,
  _next: 'none' | 'learning' | 'memorized',
  _now: string,
): AyahRecord[] {
  throw new Error('not implemented — Phase 2 (SPEC §25)');
}
