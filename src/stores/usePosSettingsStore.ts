// src/stores/usePosSettingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DiscountMode = 'percent' | 'amount';
export type PaperWidth = 58 | 80;

interface PosSettings {
  cardSurcharge: number;
  defaultDiscountMode: DiscountMode;
  paperWidth: PaperWidth;
  roundingEnabled: boolean;
  setCardSurcharge: (n: number) => void;
  setDefaultDiscountMode: (m: DiscountMode) => void;
  setPaperWidth: (w: PaperWidth) => void;
  setRoundingEnabled: (v: boolean) => void;
  resetToDefaults: () => void;
}

const DEFAULTS = {
  cardSurcharge: 10,
  defaultDiscountMode: 'percent' as DiscountMode,
  paperWidth: 58 as PaperWidth,
  roundingEnabled: false,
};


export const usePosSettingsStore = create<PosSettings>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setCardSurcharge: (n) => set({ cardSurcharge: Math.max(0, Math.min(50, n)) }),
      setDefaultDiscountMode: (m) => set({ defaultDiscountMode: m }),
      setPaperWidth: (w) => set({ paperWidth: w }),
      setRoundingEnabled: (v) => set({ roundingEnabled: v }),
      resetToDefaults: () => set(DEFAULTS),
    }),
    { name: 'cocinapp-pos-settings' }
  )
);