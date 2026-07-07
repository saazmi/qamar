// Pure planning math. Given records + a plan, project ETAs and weekly pace.
// No RN/React/AsyncStorage imports.

import type { AyahRecord } from '../hifz/types';
import type { Cadence, Plan, PlanProgress, SessionMinutes } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Rule of thumb — time-per-session → new-verses-per-session. Half of the
// session is spent reviewing the previous portion, so throughput isn't linear.
export function versesPerSessionFor(m: SessionMinutes): number {
  switch (m) {
    case 5: return 1;
    case 15: return 2;
    case 30: return 4;
    case 60: return 8;
  }
}

export function sessionsPerWeekFor(c: Cadence): number {
  switch (c) {
    case 'daily': return 7;
    case '5-per-week': return 5;
    case '3-per-week': return 3;
    case 'weekends': return 2;
  }
}

interface AyahRange {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
}

// True when `r` sits inside `range` in Quran reading order.
export function withinRange(r: { surah: number; ayah: number }, range: AyahRange): boolean {
  if (r.surah < range.fromSurah) return false;
  if (r.surah > range.toSurah) return false;
  if (r.surah === range.fromSurah && r.ayah < range.fromAyah) return false;
  if (r.surah === range.toSurah && r.ayah > range.toAyah) return false;
  return true;
}

export function goalRange(plan: Plan): AyahRange {
  if (plan.goal === 'custom' && plan.customRange) return plan.customRange;
  // For preset goals the range is [startAnchor, end-of-Quran] for our purposes;
  // the total count is authoritative via goalAyahCount, so an open-ended
  // range doesn't matter — we just filter by the anchor.
  return {
    fromSurah: plan.startAnchor.surah,
    fromAyah: plan.startAnchor.ayah,
    toSurah: 114,
    toAyah: 6236,
  };
}

export function computeProgress(records: AyahRecord[], plan: Plan, now: Date): PlanProgress {
  const range = goalRange(plan);
  const startedMs = Date.parse(plan.startedAt);
  const nowMs = now.getTime();
  const weekAgoMs = nowMs - 7 * MS_PER_DAY;

  let memorizedInGoalWindow = 0;
  let memorizedThisWeek = 0;
  for (const r of records) {
    if (r.state !== 'memorized') continue;
    if (!withinRange(r, range)) continue;
    memorizedInGoalWindow += 1;
    const t = r.memorizedAt ? Date.parse(r.memorizedAt) : NaN;
    if (!Number.isNaN(t) && t >= weekAgoMs) memorizedThisWeek += 1;
  }

  const target = plan.targetVersesPerWeek;
  const weeklyTargetPct = target > 0 ? Math.min(1, memorizedThisWeek / target) : 0;
  const paceRatio = target > 0 ? memorizedThisWeek / target : 0;

  const daysSinceStart = Math.max(0, Math.floor((nowMs - startedMs) / MS_PER_DAY));
  const versesPerDay = target / 7;
  const remainingVerses = Math.max(0, plan.goalAyahCount - memorizedInGoalWindow);
  const targetDaysRemaining = versesPerDay > 0 ? remainingVerses / versesPerDay : Infinity;
  const targetEtaMs = nowMs + targetDaysRemaining * MS_PER_DAY;

  // Actual ETA uses this week's pace as the current signal. If the user has
  // been at it long enough, prefer the rolling all-time pace.
  const overallVersesPerDay =
    daysSinceStart > 0 ? memorizedInGoalWindow / daysSinceStart : 0;
  const currentVersesPerDay =
    daysSinceStart >= 7 ? overallVersesPerDay : memorizedThisWeek / 7;

  let actualEta: string | null = null;
  if (currentVersesPerDay > 0) {
    const actualDaysRemaining = remainingVerses / currentVersesPerDay;
    actualEta = new Date(nowMs + actualDaysRemaining * MS_PER_DAY).toISOString();
  }

  return {
    memorizedInGoalWindow,
    memorizedThisWeek,
    weeklyTargetPct,
    paceRatio,
    daysSinceStart,
    targetEta: new Date(targetEtaMs).toISOString(),
    actualEta,
  };
}
