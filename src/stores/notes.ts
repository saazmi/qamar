// Zustand — notes store. SPEC §13.
// Persisted via AsyncStorage (SQLite migration is a mechanical follow-up).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type NoteScope = 'ayah' | 'surah';
export type NoteKind = 'text' | 'canvas';

// Body encoding per kind:
//   text:   the raw text
//   canvas: JSON.stringify(CanvasStroke[]) — see components/notes/Canvas.
export interface Note {
  id: string;
  scope: NoteScope;
  kind: NoteKind;
  surah: number;
  ayah?: number;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesState {
  notes: Note[];
  addNote: (input: {
    scope: NoteScope;
    kind: NoteKind;
    surah: number;
    ayah?: number;
    body: string;
  }) => Note;
  updateNote: (id: string, body: string) => void;
  removeNote: (id: string) => void;
  notesForVerse: (surah: number, ayah: number) => Note[];
  notesForSurah: (surah: number) => Note[];
  totalBodyBytes: () => number;
}

const nowIso = (): string => new Date().toISOString();

let counter = 0;
const newId = (): string => `n${Date.now().toString(36)}${(++counter).toString(36)}`;

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: ({ scope, kind, surah, ayah, body }) => {
        const now = nowIso();
        const note: Note = {
          id: newId(),
          scope,
          kind,
          surah,
          ayah: scope === 'ayah' ? ayah : undefined,
          body,
          createdAt: now,
          updatedAt: now,
        };
        set({ notes: [...get().notes, note] });
        return note;
      },

      updateNote: (id, body) => {
        set({
          notes: get().notes.map((n) =>
            n.id === id ? { ...n, body, updatedAt: nowIso() } : n,
          ),
        });
      },

      removeNote: (id) => {
        set({ notes: get().notes.filter((n) => n.id !== id) });
      },

      notesForVerse: (surah, ayah) =>
        get().notes.filter(
          (n) => n.scope === 'ayah' && n.surah === surah && n.ayah === ayah,
        ),

      notesForSurah: (surah) =>
        get().notes.filter((n) => n.scope === 'surah' && n.surah === surah),

      totalBodyBytes: () => get().notes.reduce((sum, n) => sum + n.body.length, 0),
    }),
    {
      name: 'qamar.notes.v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Migrate legacy notes (no `kind` field) to text.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.notes = state.notes.map((n) => ({ ...n, kind: n.kind ?? 'text' }));
      },
    },
  ),
);
