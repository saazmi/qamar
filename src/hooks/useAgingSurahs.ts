// Home 'À réviser' feed: surahs whose most recent memorization is older than
// the reminder baseline. Sorted oldest-first.

import { useMemo } from 'react';
import structure from '@content/structure.json';
import type { SurahMeta } from '@content/types';
import { useHifzStore } from '@stores/hifz';
import { useSettingsStore } from '@stores/settings';

const META = structure as SurahMeta[];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type AgingBucket = 'yellow' | 'orange' | 'red';

export interface AgingSurah {
  surah: number;
  name: string;
  daysSince: number;
  bucket: AgingBucket;
  memorizedCount: number;
}

// Absolute buckets — user-set baseline controls entry, colors are fixed.
function bucketFor(days: number): AgingBucket {
  if (days >= 14) return 'red';
  if (days >= 10) return 'orange';
  return 'yellow';
}

export function useAgingSurahs(): AgingSurah[] {
  const records = useHifzStore((s) => s.records);
  const baseline = useSettingsStore((s) => s.reminder.remindAfterDays);

  return useMemo(() => {
    const now = Date.now();
    // Latest memorization moment per surah (fall back to updatedAt if the
    // record predates the memorizedAt-stamping code path).
    const latestBySurah = new Map<number, number>();
    const memorizedCount = new Map<number, number>();
    for (const r of records) {
      if (r.state !== 'memorized') continue;
      memorizedCount.set(r.surah, (memorizedCount.get(r.surah) ?? 0) + 1);
      const stamp = r.memorizedAt ?? r.updatedAt;
      const t = Date.parse(stamp);
      if (Number.isNaN(t)) continue;
      const prev = latestBySurah.get(r.surah);
      if (prev === undefined || t > prev) latestBySurah.set(r.surah, t);
    }

    const result: AgingSurah[] = [];
    for (const [surahId, t] of latestBySurah) {
      const daysSince = Math.floor((now - t) / MS_PER_DAY);
      if (daysSince < baseline) continue;
      const meta = META.find((m) => m.id === surahId);
      if (!meta) continue;
      result.push({
        surah: surahId,
        name: meta.nameTransliterated,
        daysSince,
        bucket: bucketFor(daysSince),
        memorizedCount: memorizedCount.get(surahId) ?? 0,
      });
    }

    // Oldest first (most in need of review).
    result.sort((a, b) => b.daysSince - a.daysSince);
    return result;
  }, [records, baseline]);
}
