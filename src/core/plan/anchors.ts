// Starting anchor + total ayah count per preset goal.
// Counts computed against the bundled ayah-index (114 surahs / 6236 ayat).

import ayahIndex from '../../content/ayah-index.json';
import type { AyahIndex } from '../../content/types';
import type { Goal, Plan } from './types';

const IDX = ayahIndex as AyahIndex;

// Traditional memorization starts short → so Juz 'Amma anchor = An-Naba (78:1).
// Half / Full read forward from Al-Fatiha (1:1).
const ANCHORS: Record<Exclude<Goal, 'custom'>, { surah: number; ayah: number }> = {
  'juz-amma': { surah: 78, ayah: 1 },       // start of Juz 30
  'last-two-juz': { surah: 67, ayah: 1 },   // start of Juz 29 (Al-Mulk)
  half: { surah: 1, ayah: 1 },
  full: { surah: 1, ayah: 1 },
};

// Ayah count from a starting anchor forward through the end of the Quran.
export function countAyatFrom(anchor: { surah: number; ayah: number }): number {
  let n = 0;
  for (const key of Object.keys(IDX)) {
    const [sStr, aStr] = key.split(':');
    const s = Number(sStr);
    const a = Number(aStr);
    if (s < anchor.surah) continue;
    if (s === anchor.surah && a < anchor.ayah) continue;
    n += 1;
  }
  return n;
}

export function anchorFor(goal: Exclude<Goal, 'custom'>): { surah: number; ayah: number } {
  return ANCHORS[goal];
}

export function goalAyahCountFor(goal: Exclude<Goal, 'custom'>): number {
  const anchor = anchorFor(goal);
  const total = countAyatFrom(anchor);
  // Half = the first half of the *chosen* forward window. For preset 'half'
  // that means Al-Fatiha through the midpoint of the Quran (≈ 3118 ayat).
  if (goal === 'half') return Math.round(total / 2);
  return total;
}

// Convenience for the wizard's confirmation screen.
export const GOAL_LABEL: Record<Goal, string> = {
  'juz-amma': "Juz 'Amma",
  'last-two-juz': 'Les deux derniers Juz',
  half: 'La moitié du Coran',
  full: 'Le Coran entier',
  custom: 'Personnalisé',
};

// Compose the plan-creation snapshot for a preset goal, ready for the store.
export function buildPresetPlan(input: {
  goal: Exclude<Goal, 'custom'>;
  sessionMinutes: Plan['sessionMinutes'];
  cadence: Plan['cadence'];
  versesPerSession: number;
  sessionsPerWeek: number;
  startedAt: string;
}): Plan {
  return {
    goal: input.goal,
    goalAyahCount: goalAyahCountFor(input.goal),
    startAnchor: anchorFor(input.goal),
    sessionMinutes: input.sessionMinutes,
    cadence: input.cadence,
    startedAt: input.startedAt,
    versesPerSession: input.versesPerSession,
    sessionsPerWeek: input.sessionsPerWeek,
    targetVersesPerWeek: input.versesPerSession * input.sessionsPerWeek,
  };
}
