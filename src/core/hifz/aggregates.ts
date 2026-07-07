// Progress aggregates. SPEC §9.5. Computed, never stored.

import type {
  AyahIndex,
  AyahRecord,
  ProgressAggregate,
  SchedulerSettings,
  SurahId,
} from './types';
import { keyOf } from './types';
import { dueChunks } from './scheduler';

function countDueAyat(
  records: AyahRecord[],
  ayahIndex: AyahIndex,
  now: string,
  filter: (surah: SurahId, ayah: number) => boolean,
): number {
  const settings: SchedulerSettings = { dailyBudget: Number.MAX_SAFE_INTEGER, now };
  const due = dueChunks(records, ayahIndex, settings);
  let n = 0;
  for (const c of due) {
    for (let a = c.startAyah; a <= c.endAyah; a++) {
      if (filter(c.surah, a)) n += 1;
    }
  }
  return n;
}

function tally(
  records: AyahRecord[],
  ayahIndex: AyahIndex,
  now: string,
  total: number,
  filter: (surah: SurahId, ayah: number) => boolean,
): ProgressAggregate {
  let memorized = 0;
  let learning = 0;
  for (const r of records) {
    if (!filter(r.surah, r.ayah)) continue;
    if (r.state === 'memorized') memorized += 1;
    else if (r.state === 'learning') learning += 1;
  }
  const needsReview = countDueAyat(records, ayahIndex, now, filter);
  const percent = total > 0 ? memorized / total : 0;
  return { memorized, learning, needsReview, total, percent };
}

export function surahProgress(
  records: AyahRecord[],
  ayahIndex: AyahIndex,
  now: string,
  surahId: SurahId,
  surahLength: number,
): ProgressAggregate {
  return tally(records, ayahIndex, now, surahLength, (s) => s === surahId);
}

export function juzProgress(
  records: AyahRecord[],
  ayahIndex: AyahIndex,
  now: string,
  juzId: number,
): ProgressAggregate {
  let juzTotal = 0;
  for (const k of Object.keys(ayahIndex)) {
    if (ayahIndex[k]!.juz === juzId) juzTotal += 1;
  }
  return tally(records, ayahIndex, now, juzTotal, (s, a) => {
    const entry = ayahIndex[keyOf(s, a)];
    return entry?.juz === juzId;
  });
}

export function overallProgress(
  records: AyahRecord[],
  ayahIndex: AyahIndex,
  now: string,
  total = 6236,
): ProgressAggregate {
  return tally(records, ayahIndex, now, total, () => true);
}
