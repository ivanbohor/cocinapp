// src/stores/useAuthStore.ts
import { create } from 'zustand';

interface AuthState {
  rol: 'admin' | 'mozo' | null;
  restauranteId: string | null;
  nombreEmpleado: string | null;
  setAuth: (rol: 'admin' | 'mozo', restauranteId: string, nombreEmpleado: string) => void;
  clearAuth: () => void;
}

// Esta memoria guardará quién eres y a qué restaurante perteneces mientras uses la app
export const useAuthStore = create<AuthState>((set) => ({
  rol: null,
  restauranteId: null,
  nombreEmpleado: null,
  setAuth: (rol, restauranteId, nombreEmpleado) => set({ rol, restauranteId, nombreEmpleado }),
  clearAuth: () => set({ rol: null, restauranteId: null, nombreEmpleado: null }),
}));