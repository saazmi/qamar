// Today screen. SPEC §10.2 — the anti-overwhelm centerpiece.
// At most 3 cards: Continue learning · Review · Start something new.

import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, BookOpen, RefreshCcw, Sparkles } from 'lucide-react-native';
import { useSurahProgress } from '../hooks/useSurahProgress';
import { useTodayContext } from '../hooks/useTodayContext';
import { light } from '@theme/colors';

export default function TodayScreen() {
  const router = useRouter();
  const { overall } = useSurahProgress();
  const { due, continueTarget, suggestion } = useTodayContext();
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

      {continueTarget && (
        <Link
          href={{
            pathname: '/surahs/[surahId]',
            params: { surahId: String(continueTarget.surah) },
          }}
          asChild
        >
          <Pressable style={styles.card}>
            <View style={styles.cardHead}>
              <BookOpen size={16} color={light.accent} />
              <Text style={styles.cardLabel}>Continuer</Text>
            </View>
            <Text style={styles.cardTitle}>
              {continueTarget.surahName} · verset {continueTarget.ayah}
            </Text>
            <View style={styles.cardFoot}>
              <Text style={styles.cardCta}>Reprendre</Text>
              <ArrowRight size={14} color={light.accent} />
            </View>
          </Pressable>
        </Link>
      )}

      {due.length > 0 && (
        <Link href="/review" asChild>
          <Pressable style={styles.reviewCard}>
            <View style={styles.cardHead}>
              <RefreshCcw size={16} color={light.accent} />
              <Text style={styles.reviewLabel}>À réviser</Text>
            </View>
            <Text style={styles.reviewValue}>
              {due.length} chunk{due.length > 1 ? 's' : ''}
            </Text>
            <View style={styles.cardFoot}>
              <Text style={styles.cardCta}>Commencer la révision</Text>
              <ArrowRight size={14} color={light.accent} />
            </View>
          </Pressable>
        </Link>
      )}

      {suggestion && (
        <Link
          href={{
            pathname: '/surahs/[surahId]',
            params: { surahId: String(suggestion.surah) },
          }}
          asChild
        >
          <Pressable style={styles.card}>
            <View style={styles.cardHead}>
              <Sparkles size={16} color={light.accentSecondary} />
              <Text style={styles.cardLabel}>Nouvelle portion</Text>
            </View>
            <Text style={styles.cardTitle}>{suggestion.surahName}</Text>
            <View style={styles.cardFoot}>
              <Text style={styles.cardCta}>Commencer</Text>
              <ArrowRight size={14} color={light.accent} />
            </View>
          </Pressable>
        </Link>
      )}

      <Link href="/surahs" asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaLabel}>Toutes les sourates</Text>
          <Text style={styles.ctaArrow}>›</Text>
        </Pressable>
      </Link>
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
    backgroundColor: light.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: light.border,
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
  card: {
    backgroundColor: light.surface,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: light.border,
    gap: 8,
  },
  reviewCard: {
    backgroundColor: light.state.memorizedBg,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: light.accent,
    gap: 8,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: light.text,
  },
  reviewValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: light.text,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardCta: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: light.accent,
  },
  cta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: light.accent,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 4,
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
});
