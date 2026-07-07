// Zustand — hifz records + undo. SPEC §9, §15.3.
// v1 persistence via AsyncStorage (single JSON blob). SQLite migration is a
// mechanical follow-up (queries.ts will replace the storage adapter).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  applyRange as coreApplyRange,
  markReviewed as coreMarkReviewed,
  setState as coreSetState,
  type AyahRecord,
  type Chunk,
  type ReviewOutcome,
  type SurahId,
} from '@core/hifz';

const MAX_UNDO_STACK = 8;

export interface HifzSnapshot {
  records: AyahRecord[];
  label: string;
  takenAt: number;
}

export interface HifzState {
  records: AyahRecord[];
  undoStack: HifzSnapshot[];
  setState: (surah: SurahId, ayah: number, next: 'none' | 'learning' | 'memorized') => void;
  applyRange: (
    surah: SurahId,
    from: number,
    to: number,
    target: 'none' | 'learning' | 'memorized',
  ) => void;
  markReviewed: (chunk: Chunk, outcome: ReviewOutcome) => void;
  undo: () => boolean;
  clearUndoOlderThan: (ms: number) => void;
}

const nowIso = (): string => new Date().toISOString();

const pushSnapshot = (stack: HifzSnapshot[], records: AyahRecord[], label: string): HifzSnapshot[] => {
  const next = [...stack, { records, label, takenAt: Date.now() }];
  if (next.length > MAX_UNDO_STACK) next.shift();
  return next;
};

export const useHifzStore = create<HifzState>()(
  persist(
    (set, get) => ({
      records: [],
      undoStack: [],

      setState: (surah, ayah, target) => {
        const prev = get().records;
        const next = coreSetState(prev, surah, ayah, target, nowIso());
        set({
          records: next,
          undoStack: pushSnapshot(get().undoStack, prev, `${surah}:${ayah} → ${target}`),
        });
      },

      applyRange: (surah, from, to, target) => {
        const prev = get().records;
        const next = coreApplyRange(prev, surah, from, to, target, nowIso());
        set({
          records: next,
          undoStack: pushSnapshot(
            get().undoStack,
            prev,
            `${surah}:${from}–${to} → ${target}`,
          ),
        });
      },

      markReviewed: (chunk, outcome) => {
        const prev = get().records;
        const next = coreMarkReviewed(prev, chunk, outcome, nowIso());
        set({
          records: next,
          undoStack: pushSnapshot(
            get().undoStack,
            prev,
            `révision ${chunk.surah}:${chunk.startAyah}–${chunk.endAyah} · ${outcome}`,
          ),
        });
      },

      undo: () => {
        const stack = get().undoStack;
        const last = stack[stack.length - 1];
        if (!last) return false;
        set({ records: last.records, undoStack: stack.slice(0, -1) });
        return true;
      },

      clearUndoOlderThan: (ms) => {
        const cutoff = Date.now() - ms;
        const stack = get().undoStack.filter((s) => s.takenAt >= cutoff);
        if (stack.length !== get().undoStack.length) set({ undoStack: stack });
      },
    }),
    {
      name: 'qamar.hifz.v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Undo stack is intentionally session-scoped — do not persist.
      partialize: (state) => ({ records: state.records }),
    },
  ),
);
