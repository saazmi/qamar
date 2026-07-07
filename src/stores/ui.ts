// Zustand — ephemeral UI state (toast queue, sheet open flags, scroll offsets).

import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  expiresAt: number;
}

interface UiState {
  toasts: Toast[];
  showToast: (params: {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    ttlMs?: number;
  }) => string;
  dismissToast: (id: string) => void;
  clearExpiredToasts: () => void;
}

let toastCounter = 0;
const newToastId = (): string => `t${++toastCounter}`;

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  showToast: ({ message, actionLabel, onAction, ttlMs = 5000 }) => {
    const id = newToastId();
    const toast: Toast = {
      id,
      message,
      actionLabel,
      onAction,
      expiresAt: Date.now() + ttlMs,
    };
    set({ toasts: [...get().toasts, toast] });
    return id;
  },
  dismissToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
  clearExpiredToasts: () => {
    const now = Date.now();
    const remaining = get().toasts.filter((t) => t.expiresAt > now);
    if (remaining.length !== get().toasts.length) set({ toasts: remaining });
  },
}));
