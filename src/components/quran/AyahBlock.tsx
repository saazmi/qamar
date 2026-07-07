// AyahBlock — fragmented layout (FR translation on). SPEC §11.1–11.3.
// Tap dispatches to the reading-mode handler (useAyahTapHandler).
// Long-press removed 2026-07-07 — mode toolbar handles all actions now.

import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useHifzStore } from '@stores/hifz';
import { useNotesStore } from '@stores/notes';
import { light } from '@theme/colors';
import type { AyahState } from '@core/hifz';

interface Props {
  surah: number;
  ayah: number;
  text: string;
  frenchText?: string;
  showFrench?: boolean;
  fontSize?: number;
  onTap: (surah: number, ayah: number) => void;
}

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
  onTap,
}: Props) {
  const state = useHifzStore((s) => stateOf(s.records, surah, ayah));
  const hasNote = useNotesStore((s) =>
    s.notes.some((n) => n.scope === 'ayah' && n.surah === surah && n.ayah === ayah),
  );

  const style = [
    styles.block,
    state === 'learning' && styles.blockLearning,
    (state === 'memorized' || state === 'needsReview') && styles.blockMemorized,
  ];

  return (
    <Pressable onPress={() => onTap(surah, ayah)} style={style}>
      {(state === 'memorized' || state === 'needsReview') && <View style={styles.surline} />}
      <View style={styles.row}>
        {state === 'needsReview' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>↻</Text>
          </View>
        )}
        <Text style={[styles.arabic, { fontSize, lineHeight: Math.round(fontSize * 1.85) }]}>
          {text}{' '}
          {hasNote && <Text style={styles.noteGlyph}>✎ </Text>}
          <Text style={styles.marker}>﴿{ayah}﴾</Text>
        </Text>
      </View>
      {showFrench && frenchText ? <Text style={styles.french}>{frenchText}</Text> : null}
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
  noteGlyph: {
    fontSize: 16,
    color: light.accentSecondary,
  },
});
