// Zustand — in-memory session state.
// - openVerse: which (surah, ayah) has its bottom sheet open
// - readingMode: reading-view mode toolbar selection
// - rangeAnchor: first-tap anchor when readingMode = 'range'

import { create } from 'zustand';

export type ReadingMode = 'read' | 'details' | 'mark' | 'range' | 'notes' | 'listen';

interface OpenVerse {
  surah: number;
  ayah: number;
}

interface RangeSelection {
  surah: number;
  from: number;
  to: number;
}

interface SessionState {
  openVerse: OpenVerse | null;
  openVerseSheet: (surah: number, ayah: number) => void;
  closeVerseSheet: () => void;

  readingMode: ReadingMode;
  setReadingMode: (m: ReadingMode) => void;

  rangeAnchor: { surah: number; ayah: number } | null;
  setRangeAnchor: (v: { surah: number; ayah: number } | null) => void;

  rangeSelection: RangeSelection | null;
  setRangeSelection: (v: RangeSelection | null) => void;

  // ayah undefined ⇒ surah-scoped note editor.
  noteEditor: { surah: number; ayah?: number } | null;
  openNoteEditor: (surah: number, ayah?: number) => void;
  closeNoteEditor: () => void;

  // The verse currently being auto-played by continuous playback.
  playingAyah: { surah: number; ayah: number } | null;
  setPlayingAyah: (v: { surah: number; ayah: number } | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  openVerse: null,
  openVerseSheet: (surah, ayah) => set({ openVerse: { surah, ayah } }),
  closeVerseSheet: () => set({ openVerse: null }),

  readingMode: 'read',
  setReadingMode: (m) => set({ readingMode: m, rangeAnchor: null, playingAyah: null }),

  rangeAnchor: null,
  setRangeAnchor: (v) => set({ rangeAnchor: v }),

  rangeSelection: null,
  setRangeSelection: (v) => set({ rangeSelection: v }),

  noteEditor: null,
  openNoteEditor: (surah, ayah) => set({ noteEditor: { surah, ayah } }),
  closeNoteEditor: () => set({ noteEditor: null }),

  playingAyah: null,
  setPlayingAyah: (v) => set({ playingAyah: v }),
}));
