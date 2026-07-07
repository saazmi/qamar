// Zustand — user settings. SPEC §10.6. Persisted via AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface FeatureFlags {
  revisionReminder: boolean;
  assistedPlanning: boolean;
}

export interface ReminderConfig {
  remindAfterDays: number;   // baseline age (days) at which a surah enters the À réviser list
  frequencyDays: number;     // days between reminder pings (once notifications land)
  hourOfDay: number;         // 0–23, when the daily reminder fires
}

interface SettingsState {
  dailyBudget: number; // SPEC §14.3 — kept for chunk-scheduler consumers
  setDailyBudget: (n: number) => void;
  features: FeatureFlags;
  setFeature: (key: keyof FeatureFlags, value: boolean) => void;
  reminder: ReminderConfig;
  setReminder: (key: keyof ReminderConfig, value: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dailyBudget: 3,
      setDailyBudget: (n) => set({ dailyBudget: Math.max(1, Math.floor(n)) }),
      // Free mode is the default — every guided feature is opt-in.
      features: { revisionReminder: false, assistedPlanning: false },
      setFeature: (key, value) =>
        set((s) => ({ features: { ...s.features, [key]: value } })),
      reminder: {
        remindAfterDays: 7,
        frequencyDays: 3,
        hourOfDay: 18,
      },
      setReminder: (key, value) =>
        set((s) => ({
          reminder: {
            ...s.reminder,
            [key]:
              key === 'hourOfDay'
                ? Math.max(0, Math.min(23, Math.floor(value)))
                : Math.max(1, Math.floor(value)),
          },
        })),
    }),
    {
      name: 'qamar.settings.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
