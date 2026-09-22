// src/stores/useToastStore.ts
import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/** Toast completo (interno, siempre con id y duration) */
export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

/** Input del push: duration es opcional, se rellena con el default por variant */
export type ToastInput = Omit<Toast, 'id' | 'duration'> & {
  duration?: number;
};

interface ToastState {
  toasts: Toast[];
  push: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 3500,
  info: 4000,
  warning: 5000,
  error: 6000,
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (input) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const toast: Toast = {
      ...input,
      id,
      // Si el input no trae duration, usamos el default del variant
      duration: input.duration ?? DEFAULT_DURATIONS[input.variant],
    };

    set((state) => ({
      // Limitamos a 4 toasts visibles para no saturar la pantalla
      toasts: [...state.toasts, toast].slice(-4),
    }));

    if (toast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration);
    }

    return id;
  },

  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clear: () => set({ toasts: [] }),
}));

/* ------------------------------------------------------------------
   API pública — "fire and forget", usable desde cualquier lado
   ------------------------------------------------------------------ */

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'success' }),

  error: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'error' }),

  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'warning' }),

  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'info' }),

  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
};