// Per-surah + overall progress selector. SPEC §9.5.
// Derives counts from the persisted hifz records + bundled ayah-index.

import { useMemo } from 'react';
import { useHifzStore } from '@stores/hifz';
import ayahIndex from '@content/ayah-index.json';
import structure from '@content/structure.json';
import type { AyahIndex, SurahMeta } from '@content/types';
import { dueChunks, keyOf } from '@core/hifz';

const IDX = ayahIndex as AyahIndex;
const META = structure as SurahMeta[];

interface SurahCounts {
  memorized: number;
  learning: number;
  needsReview: number;
  total: number;
}

const BUDGET = { dailyBudget: Number.MAX_SAFE_INTEGER } as const;

function computeAll(records: ReturnType<typeof useHifzStore.getState>['records'], now: string) {
  const memorizedBySurah = new Map<number, number>();
  const learningBySurah = new Map<number, number>();
  for (const r of records) {
    if (r.state === 'memorized') {
      memorizedBySurah.set(r.surah, (memorizedBySurah.get(r.surah) ?? 0) + 1);
    } else if (r.state === 'learning') {
      learningBySurah.set(r.surah, (learningBySurah.get(r.surah) ?? 0) + 1);
    }
  }

  const needsBySurah = new Map<number, number>();
  const dues = dueChunks(records, IDX, { ...BUDGET, now });
  for (const c of dues) {
    const len = c.endAyah - c.startAyah + 1;
    needsBySurah.set(c.surah, (needsBySurah.get(c.surah) ?? 0) + len);
  }

  const result = new Map<number, SurahCounts>();
  for (const m of META) {
    result.set(m.id, {
      memorized: memorizedBySurah.get(m.id) ?? 0,
      learning: learningBySurah.get(m.id) ?? 0,
      needsReview: needsBySurah.get(m.id) ?? 0,
      total: m.ayahCount,
    });
  }

  const overall: SurahCounts = {
    memorized: [...memorizedBySurah.values()].reduce((a, b) => a + b, 0),
    learning: [...learningBySurah.values()].reduce((a, b) => a + b, 0),
    needsReview: [...needsBySurah.values()].reduce((a, b) => a + b, 0),
    total: 6236,
  };

  return { perSurah: result, overall };
}

export function useSurahProgress() {
  const records = useHifzStore((s) => s.records);
  return useMemo(() => computeAll(records, new Date().toISOString()), [records]);
}

export function ayahEntryFor(surah: number, ayah: number) {
  return IDX[keyOf(surah, ayah)];
}
