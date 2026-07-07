// Continuous mushaf paragraph. SPEC §11.1 (revised 2026-07-07).
// One <Text> per Madani page; ayat are nested <Text> spans with their own
// onPress/onLongPress. Background wash + colored ayah marker convey state
// (no top border — inline spans can't render borders in RN).

import { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useHifzStore } from '@stores/hifz';
import { useUiStore } from '@stores/ui';
import { light } from '@theme/colors';
import type { AyahState } from '@core/hifz';

interface Ayah {
  ayah: number;
  text: string;
}

interface Props {
  surah: number;
  page: number;
  ayat: Ayah[];
  fontSize?: number;
  onOpenSheet?: (surah: number, ayah: number) => void;
}

const CYCLE: Record<'none' | 'learning' | 'memorized', 'learning' | 'memorized' | 'none'> = {
  none: 'learning',
  learning: 'memorized',
  memorized: 'none',
};

const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

function toArabicIndic(n: number): string {
  return String(n)
    .split('')
    .map((d) => (d.match(/\d/) ? ARABIC_INDIC[Number(d)] : d))
    .join('');
}

function backgroundFor(state: AyahState): string | undefined {
  if (state === 'learning') return light.state.learningBg;
  if (state === 'memorized' || state === 'needsReview') return light.state.memorizedBg;
  return undefined;
}

function markerColorFor(state: AyahState): string {
  if (state === 'memorized') return light.accent;
  if (state === 'needsReview') return light.state.needsReview;
  if (state === 'learning') return '#8B6914';
  return light.textMuted;
}

export const ContinuousPage = memo(function ContinuousPage({
  surah,
  page,
  ayat,
  fontSize = 28,
  onOpenSheet,
}: Props) {
  const records = useHifzStore((s) => s.records);
  const setState = useHifzStore((s) => s.setState);
  const undo = useHifzStore((s) => s.undo);
  const showToast = useUiStore((s) => s.showToast);

  const stateOf = useCallback(
    (ayah: number): AyahState => {
      const r = records.find((rr) => rr.surah === surah && rr.ayah === ayah);
      return r?.state ?? 'none';
    },
    [records, surah],
  );

  const handleLongPress = useCallback(
    (ayah: number) => {
      const s = stateOf(ayah);
      const current = s === 'needsReview' ? 'memorized' : s;
      const next = CYCLE[current as 'none' | 'learning' | 'memorized'];
      setState(surah, ayah, next);
      const label = { none: 'Effacé', learning: 'En cours', memorized: 'Mémorisé' }[next];
      showToast({
        message: `${label} · ${surah}:${ayah}`,
        actionLabel: 'Annuler',
        onAction: () => undo(),
      });
    },
    [stateOf, setState, showToast, undo, surah],
  );

  return (
    <View style={styles.page}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageLabel}>page {toArabicIndic(page)}</Text>
      </View>
      <Text
        style={[
          styles.arabic,
          { fontSize, lineHeight: Math.round(fontSize * 1.95) },
        ]}
      >
        {ayat.map((a) => {
          const state = stateOf(a.ayah);
          const bg = backgroundFor(state);
          const markerColor = markerColorFor(state);
          return (
            <Text
              key={a.ayah}
              onPress={() => onOpenSheet?.(surah, a.ayah)}
              onLongPress={() => handleLongPress(a.ayah)}
              style={bg ? { backgroundColor: bg } : undefined}
            >
              {a.text}
              <Text style={[styles.marker, { color: markerColor }]}>
                {' '}
                ۝{toArabicIndic(a.ayah)}{' '}
              </Text>
            </Text>
          );
        })}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  page: {
    marginBottom: 16,
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: 8,
    opacity: 0.5,
  },
  pageLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'lowercase',
    letterSpacing: 0.5,
  },
  arabic: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    textAlign: 'justify',
    writingDirection: 'rtl',
    color: light.text,
  },
  marker: {
    fontSize: 22,
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
});
