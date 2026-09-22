// src/stores/useThemeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  setTheme: (isDark: boolean) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      setTheme: (isDark) => set({ isDark }),
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    }),
    {
      name: 'cocinapp-theme',
      // Migración: si el usuario tenía el theme viejo en 'theme', lo leemos
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const legacy = localStorage.getItem('theme');
        if (legacy && legacy !== (state.isDark ? 'dark' : 'light')) {
          state.setTheme(legacy === 'dark');
          localStorage.removeItem('theme'); // Limpiamos el legacy
        }
      },
    }
  )
);