// Zustand — assisted-planning state. Persisted via AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Plan } from '@core/plan';

interface PlanState {
  plan: Plan | null;
  setPlan: (p: Plan) => void;
  clearPlan: () => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      setPlan: (p) => set({ plan: p }),
      clearPlan: () => set({ plan: null }),
    }),
    {
      name: 'qamar.plan.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
