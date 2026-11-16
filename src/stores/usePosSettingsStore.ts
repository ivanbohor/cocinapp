// src/stores/usePosSettingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DiscountMode = 'percent' | 'amount';
export type PaperWidth = 58 | 80;
export type SurchargeMode = 'percent' | 'tiers';

interface PosSettings {
  // Tarjeta (siempre activa)
  cardSurcharge: number;

  // Transferencia (opcional)
  transferEnabled: boolean;
  transferSurchargeMode: SurchargeMode;
  transferSurchargePercent: number;
  
  // Configuración escalonada (usada por Transferencia)
  tierMinPrice: number;      // 👈 NUEVO: Mínimo para aplicar recargo
  tierThreshold: number;
  tierLowSurcharge: number;
  tierHighSurcharge: number;

  defaultDiscountMode: DiscountMode;
  paperWidth: PaperWidth;
  roundingEnabled: boolean;
  
  setCardSurcharge: (n: number) => void;
  setTransferEnabled: (v: boolean) => void;
  setTransferSurchargeMode: (m: SurchargeMode) => void;
  setTransferSurchargePercent: (n: number) => void;
  setTierSettings: (minPrice: number, threshold: number, low: number, high: number) => void; // Modificado
  
  setDefaultDiscountMode: (m: DiscountMode) => void;
  setPaperWidth: (w: PaperWidth) => void;
  setRoundingEnabled: (v: boolean) => void;
  resetToDefaults: () => void;
}

const DEFAULTS = {
  cardSurcharge: 10,
  transferEnabled: false,
  transferSurchargeMode: 'percent' as SurchargeMode,
  transferSurchargePercent: 5,
  tierMinPrice: 3000,        // 👈 Valor por defecto

  tierThreshold: 10000,
  tierLowSurcharge: 500,
  tierHighSurcharge: 1000,
  defaultDiscountMode: 'percent' as DiscountMode,
  paperWidth: 58 as PaperWidth,
  roundingEnabled: false,
};
export const usePosSettingsStore = create<PosSettings>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setCardSurcharge: (n) => set({ cardSurcharge: Math.max(0, Math.min(50, n)) }),
      setTransferEnabled: (v) => set({ transferEnabled: v }),
      setTransferSurchargeMode: (m) => set({ transferSurchargeMode: m }),
      setTransferSurchargePercent: (n) => set({ transferSurchargePercent: Math.max(0, Math.min(50, n)) }),
      setTierSettings: (minPrice, threshold, low, high) => set({ 
        tierMinPrice: Math.max(0, minPrice),
        tierThreshold: Math.max(0, threshold), 
        tierLowSurcharge: Math.max(0, low), 
        tierHighSurcharge: Math.max(0, high) 
      }),
      setDefaultDiscountMode: (m) => set({ defaultDiscountMode: m }),
      setPaperWidth: (w) => set({ paperWidth: w }),
      setRoundingEnabled: (v) => set({ roundingEnabled: v }),
      resetToDefaults: () => set(DEFAULTS),
    }),
    { name: 'cocinapp-pos-settings' }
  )
);
