// Central dispatch for a single-tap on an ayah in the reading view.
// Behavior depends on the current readingMode (session store).

import { useCallback } from 'react';
import { ensureAudioConfigured, playAyah, playRange, stopPlayback } from '@audio/player';
import structure from '@content/structure.json';
import type { SurahMeta } from '@content/types';
import { useHifzStore } from '@stores/hifz';
import { useSessionStore } from '@stores/session';
import { useUiStore } from '@stores/ui';
const CYCLE: Record<'none' | 'learning' | 'memorized', 'learning' | 'memorized' | 'none'> = {
  none: 'learning',
  learning: 'memorized',
  memorized: 'none',
};

const META = structure as SurahMeta[];

export function useAyahTapHandler() {
  const mode = useSessionStore((s) => s.readingMode);
  const rangeAnchor = useSessionStore((s) => s.rangeAnchor);
  const setRangeAnchor = useSessionStore((s) => s.setRangeAnchor);
  const setRangeSelection = useSessionStore((s) => s.setRangeSelection);
  const openVerseSheet = useSessionStore((s) => s.openVerseSheet);
  const openNoteEditor = useSessionStore((s) => s.openNoteEditor);
  const playingAyah = useSessionStore((s) => s.playingAyah);
  const setPlayingAyah = useSessionStore((s) => s.setPlayingAyah);

  const setState = useHifzStore((s) => s.setState);
  const undo = useHifzStore((s) => s.undo);
  const records = useHifzStore((s) => s.records);
  const showToast = useUiStore((s) => s.showToast);

  return useCallback(
    (surah: number, ayah: number) => {
      // Playback state overrides toolbar modes: while a surah is playing,
      // tapping any ayah in that surah restarts playback from there.
      if (playingAyah && playingAyah.surah === surah) {
        const surahMeta = META.find((m) => m.id === surah);
        const ayahCount = surahMeta?.ayahCount ?? 1;
        void (async () => {
          await stopPlayback();
          await ensureAudioConfigured();
          await playRange(surah, ayah, ayahCount, setPlayingAyah);
        })();
        return;
      }

      if (mode === 'mark') {
        const rec = records.find((r) => r.surah === surah && r.ayah === ayah);
        const from: 'none' | 'learning' | 'memorized' = rec?.state ?? 'none';
        const next = CYCLE[from];
        setState(surah, ayah, next);
        const label = { none: 'Effacé', learning: 'En cours', memorized: 'Mémorisé' }[next];
        showToast({
          message: `${label} · ${surah}:${ayah}`,
          actionLabel: 'Annuler',
          onAction: () => undo(),
        });
        return;
      }

      if (mode === 'range') {
        if (!rangeAnchor || rangeAnchor.surah !== surah) {
          setRangeAnchor({ surah, ayah });
          showToast({ message: `Ancre: ${surah}:${ayah}. Touchez la fin.` });
          return;
        }
        const from = Math.min(rangeAnchor.ayah, ayah);
        const to = Math.max(rangeAnchor.ayah, ayah);
        setRangeAnchor(null);
        setRangeSelection({ surah, from, to });
        return;
      }

      if (mode === 'notes') {
        openNoteEditor(surah, ayah);
        return;
      }

      if (mode === 'listen') {
        void (async () => {
          await ensureAudioConfigured();
          setPlayingAyah({ surah, ayah });
          await playAyah(surah, ayah, {
            onFinished: () => setPlayingAyah(null),
          });
        })();
        return;
      }

      if (mode === 'details') {
        openVerseSheet(surah, ayah);
        return;
      }

      // Default 'read' mode: taps do nothing — pure reading.
    },
    [
      mode,
      rangeAnchor,
      records,
      setRangeAnchor,
      setRangeSelection,
      setState,
      undo,
      showToast,
      openVerseSheet,
      openNoteEditor,
      playingAyah,
      setPlayingAyah,
    ],
  );
}
