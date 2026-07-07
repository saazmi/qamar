// Central dispatch for a single-tap on an ayah in the reading view.
// Behavior depends on the current readingMode (session store).

import { useCallback } from 'react';
import { useHifzStore } from '@stores/hifz';
import { useSessionStore } from '@stores/session';
import { useUiStore } from '@stores/ui';
const CYCLE: Record<'none' | 'learning' | 'memorized', 'learning' | 'memorized' | 'none'> = {
  none: 'learning',
  learning: 'memorized',
  memorized: 'none',
};

export function useAyahTapHandler() {
  const mode = useSessionStore((s) => s.readingMode);
  const rangeAnchor = useSessionStore((s) => s.rangeAnchor);
  const setRangeAnchor = useSessionStore((s) => s.setRangeAnchor);
  const openVerseSheet = useSessionStore((s) => s.openVerseSheet);

  const setState = useHifzStore((s) => s.setState);
  const applyRange = useHifzStore((s) => s.applyRange);
  const undo = useHifzStore((s) => s.undo);
  const records = useHifzStore((s) => s.records);
  const showToast = useUiStore((s) => s.showToast);

  return useCallback(
    (surah: number, ayah: number) => {
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
        applyRange(surah, from, to, 'memorized');
        setRangeAnchor(null);
        showToast({
          message: `Mémorisé · ${surah}:${from}–${to}`,
          actionLabel: 'Annuler',
          onAction: () => undo(),
        });
        return;
      }

      if (mode === 'notes') {
        showToast({ message: 'Notes — bientôt disponibles' });
        return;
      }

      if (mode === 'listen') {
        showToast({ message: 'Audio — bientôt disponible' });
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
      setState,
      applyRange,
      undo,
      showToast,
      openVerseSheet,
    ],
  );
}
