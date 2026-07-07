// Sticky mode toolbar for the reading view. Mutually-exclusive modes.
// Tapping the active mode's button clears it back to 'read'.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSessionStore, type ReadingMode } from '@stores/session';
import { light } from '@theme/colors';

interface ModeDef {
  key: ReadingMode;
  label: string;
  glyph: string;
}

const MODES: readonly ModeDef[] = [
  { key: 'mark', label: 'Marquer', glyph: '●' },
  { key: 'range', label: 'Sélection', glyph: '⇥' },
  { key: 'notes', label: 'Notes', glyph: '✎' },
  { key: 'listen', label: 'Écouter', glyph: '▶' },
  { key: 'details', label: 'Détails', glyph: 'ⓘ' },
];

export function ReadingToolbar() {
  const mode = useSessionStore((s) => s.readingMode);
  const setMode = useSessionStore((s) => s.setReadingMode);
  const rangeAnchor = useSessionStore((s) => s.rangeAnchor);

  const instruction = (() => {
    if (mode === 'details') return 'Touchez un verset pour voir ses détails.';
    if (mode === 'mark') return 'Touchez un verset pour cycler son état.';
    if (mode === 'range')
      return rangeAnchor
        ? `Ancre: ${rangeAnchor.surah}:${rangeAnchor.ayah} — touchez la fin.`
        : 'Touchez le premier verset de la sélection.';
    if (mode === 'notes') return 'Touchez un verset pour ouvrir sa note.';
    if (mode === 'listen') return 'Touchez un verset pour l\'écouter.';
    return null;
  })();

  return (
    <View>
      <View style={styles.row}>
        {MODES.map((m) => {
          const active = mode === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMode(active ? 'read' : m.key)}
              style={[styles.btn, active && styles.btnActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.glyph, active && styles.textActive]}>{m.glyph}</Text>
              <Text style={[styles.label, active && styles.textActive]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {instruction ? (
        <View style={styles.instructionBar}>
          <Text style={styles.instruction}>{instruction}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE7DD',
    backgroundColor: light.bg,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 2,
  },
  btnActive: {
    backgroundColor: light.accent,
  },
  glyph: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.textMuted,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textActive: {
    color: '#FFFFFF',
  },
  instructionBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: light.state.memorizedBg,
    borderBottomWidth: 1,
    borderBottomColor: '#DCEBE1',
  },
  instruction: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: light.accent,
    textAlign: 'center',
  },
});
