// Zustand — user settings. SPEC §10.6. Persisted via AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  dailyBudget: number; // SPEC §14.3 — max due chunks surfaced per day
  setDailyBudget: (n: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dailyBudget: 3,
      setDailyBudget: (n) => set({ dailyBudget: Math.max(1, Math.floor(n)) }),
    }),
    {
      name: 'qamar.settings.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
