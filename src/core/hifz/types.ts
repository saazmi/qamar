// hifz-core — pure types. SPEC §9, §14. No RN/React/IO imports allowed in this dir.

export type SurahId = number; // 1..114
export type AyahNumber = number;

export type AyahState = 'none' | 'learning' | 'memorized' | 'needsReview';
export type PersistedState = 'learning' | 'memorized';

export interface AyahRecord {
  surah: SurahId;
  ayah: AyahNumber;
  state: PersistedState;
  updatedAt: string;
  memorizedAt?: string;
  lastReviewedAt?: string;
  reviewCount: number;
  ladderOffset: number;
}

export interface AyahIndexEntry {
  juz: number;
  hizbQuarter: number;
  page: number;
}

export type AyahIndex = Record<string, AyahIndexEntry>;

export interface Chunk {
  surah: SurahId;
  startAyah: AyahNumber;
  endAyah: AyahNumber;
  lastReviewedAt?: string;
  memorizedAt: string;
  minReviewCount: number;
  minLadderOffset: number;
}

export interface DueChunk extends Chunk {
  intervalDays: number;
  overdueDays: number;
}

export interface SchedulerSettings {
  dailyBudget: number;
  now: string;
}

export interface ProgressAggregate {
  memorized: number;
  learning: number;
  needsReview: number;
  total: number;
  percent: number;
}

export type ReviewOutcome = 'ok' | 'hard';

export const MAX_LADDER_INDEX = 5;

export function keyOf(surah: SurahId, ayah: AyahNumber): string {
  return `${surah}:${ayah}`;
}
