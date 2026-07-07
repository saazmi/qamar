// Home 'Planification' card. Shows the active plan's daily target + weekly
// progress + rolling ETA; falls back to a CTA when no plan is set.

import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { GOAL_LABEL, computeProgress } from '@core/plan';
import { useHifzStore } from '@stores/hifz';
import { usePlanStore } from '@stores/plan';
import { light } from '@theme/colors';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function PlanCard() {
  const plan = usePlanStore((s) => s.plan);
  const records = useHifzStore((s) => s.records);

  if (!plan) {
    return (
      <Link href="/plan/setup" asChild>
        <Pressable style={styles.emptyCard}>
          <View style={styles.head}>
            <Sparkles size={16} color={light.accentSecondary} />
            <Text style={styles.emptyLabel}>Planification</Text>
          </View>
          <Text style={styles.emptyTitle}>Configurer mon plan</Text>
          <Text style={styles.emptyBody}>
            Trois questions et vous avez une cadence, un objectif hebdomadaire et
            une estimation de temps qui s'ajuste.
          </Text>
          <View style={styles.cardFoot}>
            <Text style={styles.cta}>Commencer</Text>
            <ArrowRight size={14} color={light.accent} />
          </View>
        </Pressable>
      </Link>
    );
  }

  const progress = computeProgress(records, plan, new Date());
  const weeklyPct = Math.round(progress.weeklyTargetPct * 100);
  const drift =
    progress.actualEta && progress.daysSinceStart >= 3
      ? Math.round(
          (Date.parse(progress.actualEta) - Date.parse(progress.targetEta)) /
            (24 * 60 * 60 * 1000),
        )
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Sparkles size={16} color={light.accentSecondary} />
        <Text style={styles.label}>Plan · {GOAL_LABEL[plan.goal]}</Text>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>Aujourd'hui</Text>
          <Text style={styles.metricValue}>{plan.versesPerSession}</Text>
          <Text style={styles.metricSub}>versets</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>Cette semaine</Text>
          <Text style={styles.metricValue}>
            {progress.memorizedThisWeek}
            <Text style={styles.metricValueMuted}> / {plan.targetVersesPerWeek}</Text>
          </Text>
          <Text style={styles.metricSub}>{weeklyPct}%</Text>
        </View>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${weeklyPct}%` }]} />
      </View>

      <View style={styles.etaRow}>
        <Text style={styles.etaLabel}>Fin estimée</Text>
        <Text style={styles.etaValue}>
          {formatDate(progress.actualEta ?? progress.targetEta)}
        </Text>
      </View>
      {drift !== 0 && progress.actualEta && (
        <Text style={styles.driftLine}>
          {drift < 0
            ? `${Math.abs(drift)} jour${Math.abs(drift) > 1 ? 's' : ''} d'avance`
            : `${drift} jour${drift > 1 ? 's' : ''} au-delà du plan`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: light.surface,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: light.border,
    gap: 6,
  },
  card: {
    backgroundColor: light.surface,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: light.border,
    gap: 10,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: light.text },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, color: light.textMuted },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cta: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: light.accent },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCell: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: light.surfaceMuted,
    gap: 2,
  },
  metricLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 22, color: light.text },
  metricValueMuted: { fontFamily: 'Inter_400Regular', fontSize: 14, color: light.textMuted },
  metricSub: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: light.accent },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: light.borderMuted,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: light.accent,
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  etaValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: light.text },
  driftLine: { fontFamily: 'Inter_400Regular', fontSize: 12, color: light.textMuted },
});
