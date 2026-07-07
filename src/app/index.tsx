// Today screen. SPEC §10.2 — the anti-overwhelm centerpiece.
// At most 3 cards: Continue learning · Review · Start something new.
// Below: today's delta + 7-day mini-heatmap. Nothing else.
// Phase 3 opening — real progress, link to surah list.

import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSurahProgress } from '../hooks/useSurahProgress';
import { light } from '@theme/colors';

export default function TodayScreen() {
  const { overall } = useSurahProgress();
  const pct = Math.round((overall.memorized / overall.total) * 1000) / 10;

  return (
    <ScrollView contentContainerStyle={styles.host}>
      <View style={styles.brand}>
        <Text style={styles.title}>Qamar</Text>
        <Text style={styles.tag}>Mémorise le Coran, un petit pas à la fois.</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Mémorisés</Text>
        <Text style={styles.statValue}>
          {overall.memorized.toLocaleString('fr-FR')}
          <Text style={styles.statValueMuted}> / {overall.total.toLocaleString('fr-FR')}</Text>
        </Text>
        <Text style={styles.statPct}>{pct.toFixed(1)} %</Text>
      </View>

      <Link href="/surahs" asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaLabel}>Toutes les sourates</Text>
          <Text style={styles.ctaArrow}>›</Text>
        </Pressable>
      </Link>

      {overall.needsReview > 0 && (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>À réviser</Text>
          <Text style={styles.reviewValue}>{overall.needsReview} versets</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  host: {
    padding: 20,
    paddingTop: 60,
    gap: 16,
    backgroundColor: light.bg,
    minHeight: '100%',
  },
  brand: {
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: light.text,
  },
  tag: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: light.textMuted,
    marginTop: 4,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEE7DD',
    gap: 4,
  },
  statLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: light.text,
  },
  statValueMuted: {
    fontFamily: 'Inter_400Regular',
    fontSize: 20,
    color: light.textMuted,
  },
  statPct: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.accent,
    marginTop: 4,
  },
  cta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: light.accent,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  ctaLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  ctaArrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  reviewCard: {
    backgroundColor: light.state.memorizedBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCEBE1',
    gap: 4,
  },
  reviewLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: light.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: light.text,
  },
});
