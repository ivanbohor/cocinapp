// src/stores/useThemeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

// Usamos el middleware "persist" para que Zustand guarde esto automáticamente en el navegador
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false, // Por defecto iniciará en modo claro
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    }),
    {
      name: 'cocinapp-theme', // Nombre de la variable secreta en el navegador
    }
  )
);