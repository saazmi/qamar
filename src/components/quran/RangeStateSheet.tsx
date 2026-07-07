// Range-state picker. Opens after the user taps the second bound of a
// Sélection-mode range. Lets them apply any of the 3 states to the span.

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useHifzStore } from '@stores/hifz';
import { useSessionStore } from '@stores/session';
import { useUiStore } from '@stores/ui';
import { light } from '@theme/colors';

const STATES: Array<{ key: 'none' | 'learning' | 'memorized'; label: string }> = [
  { key: 'none', label: 'Non commencé' },
  { key: 'learning', label: 'En cours' },
  { key: 'memorized', label: 'Mémorisé' },
];

export function RangeStateSheet() {
  const selection = useSessionStore((s) => s.rangeSelection);
  const clear = useSessionStore((s) => s.setRangeSelection);
  const applyRange = useHifzStore((s) => s.applyRange);
  const undo = useHifzStore((s) => s.undo);
  const showToast = useUiStore((s) => s.showToast);

  if (!selection) return null;

  const { surah, from, to } = selection;
  const count = to - from + 1;

  const apply = (target: 'none' | 'learning' | 'memorized') => {
    applyRange(surah, from, to, target);
    const stateLabel = { none: 'Effacés', learning: 'En cours', memorized: 'Mémorisés' }[target];
    showToast({
      message: `${stateLabel} · ${surah}:${from}–${to}`,
      actionLabel: 'Annuler',
      onAction: () => undo(),
    });
    clear(null);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => clear(null)}
      statusBarTranslucent
    >
      <Pressable style={styles.scrim} onPress={() => clear(null)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.grabber} />
          <Text style={styles.title}>
            {surah}:{from}–{to} · {count} versets
          </Text>
          <Text style={styles.subtitle}>Choisissez l'état à appliquer</Text>

          <View style={styles.stateColumn}>
            {STATES.map((s) => (
              <Pressable key={s.key} onPress={() => apply(s.key)} style={styles.stateBtn}>
                <Text style={styles.stateLabel}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => clear(null)} style={styles.cancelBtn}>
            <Text style={styles.cancelLabel}>Annuler</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DED7CB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: light.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: light.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  stateColumn: {
    gap: 8,
  },
  stateBtn: {
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: '#F5EFE4',
    alignItems: 'center',
  },
  stateLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: light.text,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.textMuted,
  },
});
