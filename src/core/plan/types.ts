// Assisted-planning domain types. Pure — no RN/React/store imports.

export type Goal = 'juz-amma' | 'last-two-juz' | 'half' | 'full' | 'custom';

export type SessionMinutes = 5 | 15 | 30 | 60;

export type Cadence = 'daily' | '5-per-week' | '3-per-week' | 'weekends';

export interface CustomRange {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
}

export interface Plan {
  goal: Goal;
  customRange?: CustomRange;
  goalAyahCount: number;                     // total ayat in the goal window
  startAnchor: { surah: number; ayah: number };
  sessionMinutes: SessionMinutes;
  cadence: Cadence;
  startedAt: string;                         // ISO
  // Derived at plan-creation time — snapshot for stable display.
  versesPerSession: number;
  sessionsPerWeek: number;
  targetVersesPerWeek: number;
}

export interface PlanProgress {
  memorizedInGoalWindow: number;             // memorized ayat inside the goal range
  memorizedThisWeek: number;                 // rolling 7-day count of new memorizations
  weeklyTargetPct: number;                   // 0..1
  paceRatio: number;                         // actual / plan; 1 = on pace
  daysSinceStart: number;
  targetEta: string;                         // ISO — plan's own projected end
  actualEta: string | null;                  // ISO — projected end at current pace
}
