// src/stores/usePosSettingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DiscountMode = 'percent' | 'amount';
export type PaperWidth = 58 | 80;

interface PosSettings {
  cardSurcharge: number;
  defaultDiscountMode: DiscountMode;
  paperWidth: PaperWidth;
  setCardSurcharge: (n: number) => void;
  setDefaultDiscountMode: (m: DiscountMode) => void;
  setPaperWidth: (w: PaperWidth) => void;
  resetToDefaults: () => void;
}

const DEFAULTS = {
  cardSurcharge: 10,
  defaultDiscountMode: 'percent' as DiscountMode,
  paperWidth: 58 as PaperWidth,
};

export const usePosSettingsStore = create<PosSettings>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setCardSurcharge: (n) => set({ cardSurcharge: Math.max(0, Math.min(50, n)) }),
      setDefaultDiscountMode: (m) => set({ defaultDiscountMode: m }),
      setPaperWidth: (w) => set({ paperWidth: w }),
      resetToDefaults: () => set(DEFAULTS),
    }),
    { name: 'cocinapp-pos-settings' }
  )
);