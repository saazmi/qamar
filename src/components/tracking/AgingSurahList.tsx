// Aging list rendered on Home when the Revision Reminder feature is on.
// Color-coded per bucket; tap opens the reading view for that surah.

import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { AgingBucket, AgingSurah } from '../../hooks/useAgingSurahs';
import { light } from '@theme/colors';

const BUCKET_COLORS: Record<AgingBucket, { bg: string; text: string; border: string }> = {
  yellow: { bg: '#F4E4A2', text: '#7A5A00', border: '#D9B84A' },
  orange: { bg: '#F0C99A', text: '#7A3E00', border: '#D69048' },
  red: { bg: '#E8B0A2', text: '#7A1F0F', border: '#B0432E' },
};

interface Props {
  items: AgingSurah[];
}

export function AgingSurahList({ items }: Props) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyLabel}>Aucune sourate à réviser</Text>
        <Text style={styles.emptySub}>
          Tout est à jour dans le délai que vous avez configuré.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.column}>
      {items.map((s) => {
        const c = BUCKET_COLORS[s.bucket];
        const rowStyle: StyleProp<ViewStyle> = StyleSheet.flatten([
          styles.row,
          { backgroundColor: c.bg, borderColor: c.border },
        ]);
        return (
          <Link
            key={s.surah}
            href={{ pathname: '/surahs/[surahId]', params: { surahId: String(s.surah) } }}
            asChild
          >
            <Pressable style={rowStyle}>
              <View style={styles.rowMain}>
                <Text style={[styles.name, { color: c.text }]}>{s.name}</Text>
                <Text style={[styles.sub, { color: c.text }]}>
                  {s.memorizedCount} verset{s.memorizedCount > 1 ? 's' : ''} · dernière
                  action il y a {s.daysSince} jour{s.daysSince > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={[styles.pill, { borderColor: c.border }]}>
                <Text style={[styles.pillText, { color: c.text }]}>{s.daysSince}j</Text>
              </View>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    opacity: 0.85,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    backgroundColor: light.surface,
    gap: 4,
  },
  emptyLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.text,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: light.textMuted,
  },
});
