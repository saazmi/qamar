// Settings screen. SPEC §10.6.

import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useSettingsStore,
  type FeatureFlags,
  type ReminderConfig,
} from '@stores/settings';
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
      "Liste sur la page d'accueil les sourates dont la dernière mémorisation dépasse le délai que vous fixez.",
  },
  {
    key: 'assistedPlanning',
    label: 'Planification assistée',
    description:
      "Un plan personnalisé avec cadence adaptée et estimation de temps qui se met à jour selon votre rythme.",
  },
];

interface ReminderFieldDef {
  key: keyof ReminderConfig;
  label: string;
  unit: string;
  min: number;
  max: number;
}

const REMINDER_FIELDS: readonly ReminderFieldDef[] = [
  { key: 'remindAfterDays', label: 'Rappel après', unit: 'jours', min: 1, max: 365 },
  { key: 'frequencyDays', label: 'Fréquence', unit: 'jours', min: 1, max: 90 },
  { key: 'hourOfDay', label: 'Heure de rappel', unit: 'h', min: 0, max: 23 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const features = useSettingsStore((s) => s.features);
  const setFeature = useSettingsStore((s) => s.setFeature);
  const reminder = useSettingsStore((s) => s.reminder);
  const setReminder = useSettingsStore((s) => s.setReminder);

  return (
    <View style={styles.host}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Réglages</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
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
              {REMINDER_FIELDS.map((f, i) => (
                <View
                  key={f.key}
                  style={[styles.reminderRow, i > 0 && styles.reminderRowDivider]}
                >
                  <Text style={styles.reminderLabel}>{f.label}</Text>
                  <View style={styles.reminderInputWrap}>
                    <TextInput
                      value={String(reminder[f.key])}
                      onChangeText={(t) => {
                        const n = Number(t.replace(/[^\d]/g, ''));
                        if (!Number.isNaN(n)) setReminder(f.key, n);
                      }}
                      keyboardType="number-pad"
                      style={styles.reminderInput}
                      maxLength={3}
                    />
                    <Text style={styles.reminderUnit}>{f.unit}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
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
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  reminderRowDivider: {
    borderTopWidth: 1,
    borderTopColor: light.borderMuted,
  },
  reminderLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: light.text,
  },
  reminderInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: light.bg,
  },
  reminderInput: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: light.text,
    minWidth: 36,
    padding: 0,
    textAlign: 'right',
  },
  reminderUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: light.textMuted,
  },
});
