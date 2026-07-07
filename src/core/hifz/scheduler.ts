// Revision scheduler. SPEC §14.2–14.4.
// Ladder intervalDays: 1 → 3 → 7 → 14 → 30 → 60 (capped).

import type {
  AyahIndex,
  AyahRecord,
  Chunk,
  DueChunk,
  ReviewOutcome,
  SchedulerSettings,
} from './types';
import { MAX_LADDER_INDEX } from './types';
import { deriveChunks } from './chunks';

export const LADDER_DAYS = [1, 3, 7, 14, 30, 60] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function clampIndex(i: number): number {
  if (i < 0) return 0;
  if (i > MAX_LADDER_INDEX) return MAX_LADDER_INDEX;
  return i;
}

export function ladderIndexFor(chunk: Chunk): number {
  return clampIndex(chunk.minReviewCount + chunk.minLadderOffset);
}

export function intervalDaysFor(chunk: Chunk): number {
  return LADDER_DAYS[ladderIndexFor(chunk)]!;
}

function daysBetween(fromIso: string, toIso: string): number {
  return (Date.parse(toIso) - Date.parse(fromIso)) / MS_PER_DAY;
}

export function overdueDaysFor(chunk: Chunk, now: string): number {
  const anchor = chunk.lastReviewedAt ?? chunk.memorizedAt;
  return daysBetween(anchor, now) - intervalDaysFor(chunk);
}

export function isDue(chunk: Chunk, now: string): boolean {
  return overdueDaysFor(chunk, now) > 0;
}

export function dueChunks(
  records: AyahRecord[],
  ayahIndex: AyahIndex,
  settings: SchedulerSettings,
): DueChunk[] {
  const chunks = deriveChunks(records, ayahIndex);
  const enriched: DueChunk[] = [];
  for (const c of chunks) {
    const overdue = overdueDaysFor(c, settings.now);
    if (overdue > 0) {
      enriched.push({
        ...c,
        intervalDays: intervalDaysFor(c),
        overdueDays: overdue,
      });
    }
  }
  enriched.sort((a, b) => b.overdueDays - a.overdueDays);
  return enriched.slice(0, Math.max(0, settings.dailyBudget));
}

export function markReviewed(
  records: AyahRecord[],
  chunk: Chunk,
  outcome: ReviewOutcome,
  now: string,
): AyahRecord[] {
  return records.map((r) => {
    const inChunk =
      r.surah === chunk.surah &&
      r.ayah >= chunk.startAyah &&
      r.ayah <= chunk.endAyah &&
      r.state === 'memorized';
    if (!inChunk) return r;
    if (outcome === 'ok') {
      return {
        ...r,
        lastReviewedAt: now,
        reviewCount: r.reviewCount + 1,
        updatedAt: now,
      };
    }
    const lowerBound = r.reviewCount === 0 ? 0 : -r.reviewCount;
    return {
      ...r,
      lastReviewedAt: now,
      ladderOffset: Math.max(lowerBound, r.ladderOffset - 1),
      updatedAt: now,
    };
  });
}
