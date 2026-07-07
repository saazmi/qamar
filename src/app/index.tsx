// Today screen. SPEC §10.2.
//
// Free-mode default: nothing is nudged — just progress stats and a way into
// the surahs. Guided features live behind explicit toggles in Settings.

import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Settings, Sparkles } from 'lucide-react-native';
import { AgingSurahList } from '@components/tracking/AgingSurahList';
import { useAgingSurahs } from '../hooks/useAgingSurahs';
import { useSurahProgress } from '../hooks/useSurahProgress';
import { useSettingsStore } from '@stores/settings';
import { light } from '@theme/colors';

export default function TodayScreen() {
  const router = useRouter();
  const { overall } = useSurahProgress();
  const features = useSettingsStore((s) => s.features);
  const aging = useAgingSurahs();
  const pct = Math.round((overall.memorized / overall.total) * 1000) / 10;

  return (
    <ScrollView contentContainerStyle={styles.host}>
      <View style={styles.brand}>
        <View style={styles.brandRow}>
          <Text style={styles.title}>Qamar</Text>
          <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
            <Settings size={18} color={light.textMuted} />
          </Pressable>
        </View>
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

      {features.revisionReminder && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>À réviser</Text>
          <AgingSurahList items={aging} />
        </View>
      )}

      {features.assistedPlanning && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Planification</Text>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Sparkles size={16} color={light.accentSecondary} />
              <Text style={styles.cardLabel}>À configurer</Text>
            </View>
            <Text style={styles.cardTitle}>Répondez à quelques questions</Text>
            <Text style={styles.cardBody}>
              Nous générerons un plan personnalisé avec une cadence adaptée et une
              estimation de temps qui se met à jour selon votre rythme.
            </Text>
            <Text style={styles.cardCta}>Bientôt disponible</Text>
          </View>
        </View>
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
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: light.surface,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: light.border,
    gap: 6,
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
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: light.text,
  },
  cardBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: light.textMuted,
  },
  cardCta: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
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
