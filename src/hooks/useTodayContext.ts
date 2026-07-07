// Derives Today-screen inputs: due chunks under the user's daily budget,
// last learning-range target, and a suggestion for "start something new".

import { useMemo } from 'react';
import ayahIndex from '@content/ayah-index.json';
import structure from '@content/structure.json';
import type { AyahIndex, SurahMeta } from '@content/types';
import { dueChunks } from '@core/hifz';
import type { DueChunk } from '@core/hifz';
import { useHifzStore } from '@stores/hifz';
import { useSettingsStore } from '@stores/settings';

const IDX = ayahIndex as AyahIndex;
const META = structure as SurahMeta[];

export interface ContinueTarget {
  surah: number;
  ayah: number;
  surahName: string;
}

export interface Suggestion {
  surah: number;
  ayah: number;
  surahName: string;
}

interface TodayContext {
  due: DueChunk[];
  continueTarget: ContinueTarget | null;
  suggestion: Suggestion | null;
}

export function useTodayContext(): TodayContext {
  const records = useHifzStore((s) => s.records);
  const dailyBudget = useSettingsStore((s) => s.dailyBudget);

  return useMemo(() => {
    const now = new Date().toISOString();
    const due = dueChunks(records, IDX, { dailyBudget, now });

    // Continue learning: pick the most-recently updated 'learning' record.
    const learningRecs = records.filter((r) => r.state === 'learning');
    learningRecs.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    const lastLearning = learningRecs[0];
    const continueTarget: ContinueTarget | null = lastLearning
      ? {
          surah: lastLearning.surah,
          ayah: lastLearning.ayah,
          surahName:
            META.find((m) => m.id === lastLearning.surah)?.nameTransliterated ?? '',
        }
      : null;

    // Start something new: only when there is no active learning range.
    // For fresh users: propose Juz 'Amma (An-Naba, surah 78). Otherwise pick
    // the next surah after the user's furthest touched surah.
    let suggestion: Suggestion | null = null;
    if (!continueTarget) {
      const touched = new Set(records.map((r) => r.surah));
      const untouched = touched.size === 0 ? 78 : (Math.max(...touched) % 114) + 1;
      suggestion = {
        surah: untouched,
        ayah: 1,
        surahName: META.find((m) => m.id === untouched)?.nameTransliterated ?? '',
      };
    }

    return { due, continueTarget, suggestion };
  }, [records, dailyBudget]);
}
