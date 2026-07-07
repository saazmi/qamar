// State transitions. SPEC §9.1–9.3. Pure, undo-friendly (returns new snapshot).

import type { AyahRecord, AyahState, SurahId, AyahNumber } from './types';

export function findRecord(
  records: AyahRecord[],
  surah: SurahId,
  ayah: AyahNumber,
): AyahRecord | undefined {
  return records.find((r) => r.surah === surah && r.ayah === ayah);
}

export function getState(
  records: AyahRecord[],
  surah: SurahId,
  ayah: AyahNumber,
): AyahState {
  return findRecord(records, surah, ayah)?.state ?? 'none';
}

export function setState(
  records: AyahRecord[],
  surah: SurahId,
  ayah: AyahNumber,
  next: 'none' | 'learning' | 'memorized',
  now: string,
): AyahRecord[] {
  const existing = findRecord(records, surah, ayah);

  if (next === 'none') {
    if (!existing) return records;
    return records.filter((r) => r !== existing);
  }

  if (!existing) {
    const created: AyahRecord = {
      surah,
      ayah,
      state: next,
      updatedAt: now,
      memorizedAt: next === 'memorized' ? now : undefined,
      reviewCount: 0,
      ladderOffset: 0,
    };
    return [...records, created];
  }

  const updated: AyahRecord = {
    ...existing,
    state: next,
    updatedAt: now,
    memorizedAt:
      existing.memorizedAt ?? (next === 'memorized' ? now : undefined),
  };
  return records.map((r) => (r === existing ? updated : r));
}
