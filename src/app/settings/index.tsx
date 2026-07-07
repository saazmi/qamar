// Settings screen. SPEC §10.6.

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSettingsStore, type FeatureFlags } from '@stores/settings';
import { light } from '@theme/colors';

interface ToggleRow {
  key: keyof FeatureFlags;
  label: string;
  description: string;
}

const FEATURE_ROWS: readonly ToggleRow[] = [
  {
    key: 'revisionReminder',
    label: 'Rappels de révision',
    description:
      "Suggère les chunks à réviser en fonction de la date de mémorisation (ladder 1→3→7→14→30→60 jours).",
  },
  {
    key: 'assistedPlanning',
    label: 'Planification assistée',
    description:
      "Un plan personnalisé : quelques questions, une cadence adaptée et une estimation de temps qui se met à jour selon votre rythme.",
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const features = useSettingsStore((s) => s.features);
  const setFeature = useSettingsStore((s) => s.setFeature);
  const dailyBudget = useSettingsStore((s) => s.dailyBudget);
  const setDailyBudget = useSettingsStore((s) => s.setDailyBudget);

  return (
    <View style={styles.host}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Réglages</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>Fonctionnalités</Text>
        {FEATURE_ROWS.map((row) => (
          <View key={row.key} style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Switch
                value={features[row.key]}
                onValueChange={(v) => setFeature(row.key, v)}
                trackColor={{ false: light.border, true: light.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={styles.rowDesc}>{row.description}</Text>
          </View>
        ))}

        {features.revisionReminder && (
          <>
            <Text style={styles.sectionLabel}>Rappels de révision</Text>
            <View style={styles.card}>
              <Text style={styles.rowLabel}>Budget quotidien</Text>
              <Text style={styles.rowDesc}>
                Nombre maximum de chunks à réviser par jour.
              </Text>
              <View style={styles.budgetRow}>
                {[1, 3, 5].map((n) => {
                  const active = dailyBudget === n;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setDailyBudget(n)}
                      style={[styles.budgetBtn, active && styles.budgetBtnActive]}
                    >
                      <Text
                        style={[
                          styles.budgetLabel,
                          active && styles.budgetLabelActive,
                        ]}
                      >
                        {n}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: light.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: light.border,
  },
  back: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    color: light.text,
    width: 24,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: light.text,
    textAlign: 'center',
  },
  body: {
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 2,
  },
  card: {
    backgroundColor: light.surface,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: light.text,
  },
  rowDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: light.textMuted,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  budgetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: light.border,
    alignItems: 'center',
    backgroundColor: light.surfaceMuted,
  },
  budgetBtnActive: {
    borderColor: light.accent,
    backgroundColor: light.accent,
  },
  budgetLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: light.text,
  },
  budgetLabelActive: {
    color: '#FFFFFF',
  },
});
