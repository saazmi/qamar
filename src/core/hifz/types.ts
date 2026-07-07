// hifz-core — pure types. SPEC §9. No RN/React/IO imports allowed in this dir.

export type SurahId = number; // 1..114
export type AyahNumber = number;

export type AyahState = 'none' | 'learning' | 'memorized' | 'needsReview';

export interface AyahRecord {
  surah: SurahId;
  ayah: AyahNumber;
  state: 'learning' | 'memorized';
  updatedAt: string;
  memorizedAt?: string;
  lastReviewedAt?: string;
  reviewCount: number;
  ladderOffset?: number;
}

export interface AyahIndexEntry {
  juz: number;
  hizbQuarter: number;
  page: number;
}

export interface Chunk {
  surah: SurahId;
  startAyah: AyahNumber;
  endAyah: AyahNumber;
  lastReviewedAt?: string;
  minReviewCount: number;
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
