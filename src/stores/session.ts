// Zustand — in-memory session state.
// - openVerse: which (surah, ayah) has its bottom sheet open, if any.

import { create } from 'zustand';

interface OpenVerse {
  surah: number;
  ayah: number;
}

interface SessionState {
  openVerse: OpenVerse | null;
  openVerseSheet: (surah: number, ayah: number) => void;
  closeVerseSheet: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  openVerse: null,
  openVerseSheet: (surah, ayah) => set({ openVerse: { surah, ayah } }),
  closeVerseSheet: () => set({ openVerse: null }),
}));
