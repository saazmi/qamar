// Zustand — in-memory session state.
// - openVerse: which (surah, ayah) has its bottom sheet open
// - readingMode: reading-view mode toolbar selection
// - rangeAnchor: first-tap anchor when readingMode = 'range'

import { create } from 'zustand';

export type ReadingMode = 'read' | 'mark' | 'range' | 'notes' | 'listen';

interface OpenVerse {
  surah: number;
  ayah: number;
}

interface SessionState {
  openVerse: OpenVerse | null;
  openVerseSheet: (surah: number, ayah: number) => void;
  closeVerseSheet: () => void;

  readingMode: ReadingMode;
  setReadingMode: (m: ReadingMode) => void;

  rangeAnchor: { surah: number; ayah: number } | null;
  setRangeAnchor: (v: { surah: number; ayah: number } | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  openVerse: null,
  openVerseSheet: (surah, ayah) => set({ openVerse: { surah, ayah } }),
  closeVerseSheet: () => set({ openVerse: null }),

  readingMode: 'read',
  setReadingMode: (m) => set({ readingMode: m, rangeAnchor: null }),

  rangeAnchor: null,
  setRangeAnchor: (v) => set({ rangeAnchor: v }),
}));
