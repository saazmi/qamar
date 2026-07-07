// AyahBlock — one tappable ayah unit. SPEC §11.1–11.3.
// Tap = safe (opens sheet, wired later). Long-press = cycle state through
// none → learning → memorized → none with 5s undo snackbar.

import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useHifzStore } from '@stores/hifz';
import { useUiStore } from '@stores/ui';
import { light } from '@theme/colors';
import type { AyahState } from '@core/hifz';

interface Props {
  surah: number;
  ayah: number;
  text: string;
  frenchText?: string;
  showFrench?: boolean;
  fontSize?: number;
  onOpenSheet?: (surah: number, ayah: number) => void;
}

const CYCLE: Record<'none' | 'learning' | 'memorized', 'learning' | 'memorized' | 'none'> = {
  none: 'learning',
  learning: 'memorized',
  memorized: 'none',
};

function stateOf(records: ReturnType<typeof useHifzStore.getState>['records'], surah: number, ayah: number): AyahState {
  const r = records.find((rr) => rr.surah === surah && rr.ayah === ayah);
  return r?.state ?? 'none';
}

export const AyahBlock = memo(function AyahBlock({
  surah,
  ayah,
  text,
  frenchText,
  showFrench,
  fontSize = 28,
  onOpenSheet,
}: Props) {
  const state = useHifzStore((s) => stateOf(s.records, surah, ayah));
  const setState = useHifzStore((s) => s.setState);
  const undo = useHifzStore((s) => s.undo);
  const showToast = useUiStore((s) => s.showToast);

  const onLongPress = useCallback(() => {
    const current = state === 'needsReview' ? 'memorized' : state;
    const next = CYCLE[current as 'none' | 'learning' | 'memorized'];
    setState(surah, ayah, next);
    const label = { none: 'Effacé', learning: 'En cours', memorized: 'Mémorisé' }[next];
    showToast({
      message: `${label} · ${surah}:${ayah}`,
      actionLabel: 'Annuler',
      onAction: () => undo(),
    });
  }, [state, surah, ayah, setState, showToast, undo]);

  const onTap = useCallback(() => {
    onOpenSheet?.(surah, ayah);
  }, [onOpenSheet, surah, ayah]);

  const style = [
    styles.block,
    state === 'learning' && styles.blockLearning,
    (state === 'memorized' || state === 'needsReview') && styles.blockMemorized,
  ];

  return (
    <Pressable onPress={onTap} onLongPress={onLongPress} delayLongPress={350} style={style}>
      {(state === 'memorized' || state === 'needsReview') && <View style={styles.surline} />}
      <View style={styles.row}>
        {state === 'needsReview' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>↻</Text>
          </View>
        )}
        <Text
          style={[
            styles.arabic,
            { fontSize, lineHeight: Math.round(fontSize * 1.85) },
          ]}
        >
          {text} <Text style={styles.marker}>﴿{ayah}﴾</Text>
        </Text>
      </View>
      {showFrench && frenchText ? (
        <Text style={styles.french}>{frenchText}</Text>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  block: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  blockLearning: {
    backgroundColor: light.state.learningBg,
  },
  blockMemorized: {
    backgroundColor: light.state.memorizedBg,
  },
  surline: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 0,
    height: 2,
    backgroundColor: light.state.memorizedLine,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
  },
  arabic: {
    flex: 1,
    fontFamily: 'NotoNaskhArabic_400Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: light.text,
  },
  marker: {
    color: light.textMuted,
    fontSize: 20,
  },
  badge: {
    marginTop: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.state.needsReview,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  french: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: light.textMuted,
    marginTop: 8,
  },
});
