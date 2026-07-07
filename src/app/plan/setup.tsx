// Assisted-planning wizard. Three focused questions → derived plan → confirm.

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Check } from 'lucide-react-native';
import {
  buildPresetPlan,
  GOAL_LABEL,
  sessionsPerWeekFor,
  versesPerSessionFor,
  type Cadence,
  type Goal,
  type SessionMinutes,
} from '@core/plan';
import { usePlanStore } from '@stores/plan';
import { light } from '@theme/colors';

type Step = 0 | 1 | 2 | 3;

const GOAL_CHOICES: { key: Exclude<Goal, 'custom'>; label: string; desc: string }[] = [
  { key: 'juz-amma', label: "Juz 'Amma", desc: 'Sourates 78 à 114 · ~564 versets' },
  { key: 'last-two-juz', label: 'Les deux derniers Juz', desc: 'Juz 29 et 30' },
  { key: 'half', label: 'La moitié du Coran', desc: '~3118 versets' },
  { key: 'full', label: 'Le Coran entier', desc: '6236 versets' },
];

const TIME_CHOICES: { key: SessionMinutes; label: string; desc: string }[] = [
  { key: 5, label: '5 min', desc: '~1 verset par session' },
  { key: 15, label: '15 min', desc: '~2 versets par session' },
  { key: 30, label: '30 min', desc: '~4 versets par session' },
  { key: 60, label: '60 min', desc: '~8 versets par session' },
];

const CADENCE_CHOICES: { key: Cadence; label: string; desc: string }[] = [
  { key: 'daily', label: 'Chaque jour', desc: '7 sessions par semaine' },
  { key: '5-per-week', label: '5 jours par semaine', desc: '5 sessions par semaine' },
  { key: '3-per-week', label: '3 jours par semaine', desc: '3 sessions par semaine' },
  { key: 'weekends', label: 'Le weekend', desc: '2 sessions par semaine' },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function PlanSetupScreen() {
  const router = useRouter();
  const setPlan = usePlanStore((s) => s.setPlan);

  const [step, setStep] = useState<Step>(0);
  const [goal, setGoal] = useState<Exclude<Goal, 'custom'> | null>(null);
  const [time, setTime] = useState<SessionMinutes | null>(null);
  const [cadence, setCadence] = useState<Cadence | null>(null);

  const preview = useMemo(() => {
    if (!goal || !time || !cadence) return null;
    const versesPerSession = versesPerSessionFor(time);
    const sessionsPerWeek = sessionsPerWeekFor(cadence);
    const targetVersesPerWeek = versesPerSession * sessionsPerWeek;
    const plan = buildPresetPlan({
      goal,
      sessionMinutes: time,
      cadence,
      versesPerSession,
      sessionsPerWeek,
      startedAt: new Date().toISOString(),
    });
    const weeks = plan.goalAyahCount / targetVersesPerWeek;
    const etaDate = new Date(Date.now() + weeks * 7 * MS_PER_DAY);
    return {
      plan,
      etaDate,
      weeks,
      targetVersesPerWeek,
    };
  }, [goal, time, cadence]);

  const confirm = () => {
    if (!preview) return;
    setPlan(preview.plan);
    router.replace('/');
  };

  return (
    <View style={styles.host}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Plan personnalisé</Text>
        <Text style={styles.step}>{step + 1}/4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {step === 0 && (
          <QuestionCard
            index={1}
            question="Quel est votre objectif ?"
            help="Combien souhaitez-vous mémoriser au total ?"
          >
            {GOAL_CHOICES.map((c) => (
              <Choice
                key={c.key}
                label={c.label}
                desc={c.desc}
                active={goal === c.key}
                onPress={() => {
                  setGoal(c.key);
                  setStep(1);
                }}
              />
            ))}
          </QuestionCard>
        )}

        {step === 1 && (
          <QuestionCard
            index={2}
            question="Combien de temps par session ?"
            help="On estime la moitié du temps pour réviser les anciennes portions."
          >
            {TIME_CHOICES.map((c) => (
              <Choice
                key={c.key}
                label={c.label}
                desc={c.desc}
                active={time === c.key}
                onPress={() => {
                  setTime(c.key);
                  setStep(2);
                }}
              />
            ))}
          </QuestionCard>
        )}

        {step === 2 && (
          <QuestionCard
            index={3}
            question="À quelle fréquence ?"
            help="On adapte l'objectif hebdomadaire à votre rythme réel."
          >
            {CADENCE_CHOICES.map((c) => (
              <Choice
                key={c.key}
                label={c.label}
                desc={c.desc}
                active={cadence === c.key}
                onPress={() => {
                  setCadence(c.key);
                  setStep(3);
                }}
              />
            ))}
          </QuestionCard>
        )}

        {step === 3 && preview && (
          <View style={styles.card}>
            <Text style={styles.summaryLabel}>Votre plan</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLine}>
                {GOAL_LABEL[preview.plan.goal]}
              </Text>
              <Text style={styles.summaryTag}>
                {preview.plan.goalAyahCount} versets
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLine}>
                {preview.plan.sessionMinutes} min · {' '}
                {CADENCE_CHOICES.find((c) => c.key === preview.plan.cadence)?.label.toLowerCase()}
              </Text>
              <Text style={styles.summaryTag}>
                {preview.targetVersesPerWeek}/sem
              </Text>
            </View>

            <View style={styles.etaBlock}>
              <Text style={styles.etaLabel}>Estimation</Text>
              <Text style={styles.etaValue}>
                {Math.round(preview.weeks)} semaines
              </Text>
              <Text style={styles.etaSub}>
                fin prévue le{' '}
                {preview.etaDate.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <Pressable style={styles.primaryBtn} onPress={confirm}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.primaryLabel}>Confirmer le plan</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => setStep(0)}>
              <Text style={styles.secondaryLabel}>Recommencer</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface QuestionCardProps {
  index: number;
  question: string;
  help: string;
  children: React.ReactNode;
}
function QuestionCard({ index, question, help, children }: QuestionCardProps) {
  return (
    <View style={styles.qCard}>
      <Text style={styles.qIndex}>Question {index}</Text>
      <Text style={styles.qTitle}>{question}</Text>
      <Text style={styles.qHelp}>{help}</Text>
      <View style={styles.choices}>{children}</View>
    </View>
  );
}

interface ChoiceProps {
  label: string;
  desc: string;
  active: boolean;
  onPress: () => void;
}
function Choice({ label, desc, active, onPress }: ChoiceProps) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.choiceLabel, active && styles.choiceLabelActive]}>{label}</Text>
        <Text style={[styles.choiceDesc, active && styles.choiceDescActive]}>{desc}</Text>
      </View>
      <ArrowRight size={14} color={active ? '#FFFFFF' : light.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: light.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: light.border,
  },
  back: { fontSize: 28, fontFamily: 'Inter_600SemiBold', color: light.text, width: 24 },
  title: { flex: 1, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 18, color: light.text },
  step: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: light.textMuted, width: 32, textAlign: 'right' },
  body: { padding: 20, gap: 12 },
  qCard: {
    backgroundColor: light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    padding: 18,
    gap: 6,
  },
  qIndex: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: light.text, marginTop: 2 },
  qHelp: { fontFamily: 'Inter_400Regular', fontSize: 13, color: light.textMuted, marginBottom: 8 },
  choices: { gap: 8 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: light.border,
    backgroundColor: light.surfaceMuted,
  },
  choiceActive: {
    borderColor: light.accent,
    backgroundColor: light.accent,
  },
  choiceLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: light.text },
  choiceLabelActive: { color: '#FFFFFF' },
  choiceDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: light.textMuted, marginTop: 2 },
  choiceDescActive: { color: 'rgba(255,255,255,0.85)' },
  card: {
    backgroundColor: light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    padding: 18,
    gap: 8,
  },
  summaryLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: light.borderMuted,
  },
  summaryLine: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: light.text, flex: 1 },
  summaryTag: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: light.accent,
  },
  etaBlock: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    backgroundColor: light.state.memorizedBg,
    borderWidth: 1,
    borderColor: light.accent,
    gap: 2,
  },
  etaLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  etaValue: { fontFamily: 'Inter_700Bold', fontSize: 24, color: light.text },
  etaSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: light.textMuted },
  primaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: light.accent,
  },
  primaryLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  secondaryBtn: { paddingVertical: 10, alignItems: 'center' },
  secondaryLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: light.textMuted },
});
