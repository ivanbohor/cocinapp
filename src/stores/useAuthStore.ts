// src/stores/useAuthStore.ts
import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

// Definimos el "contrato" (tipado) estricto para TypeScript
interface AuthState {
  user: User | null;
  restauranteId: string | null;
  rol: string | null;
  setAuth: (user: User | null, restauranteId: string | null, rol: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  restauranteId: null,
  rol: null,
  
  // Actualizamos la memoria con los datos exactos que envía el Login
  setAuth: (user, restauranteId, rol) => set({ 
    user, 
    restauranteId, 
    rol 
  }),
  
  // Limpiamos todo al cerrar sesión
  clearAuth: () => set({ 
    user: null, 
    restauranteId: null, 
    rol: null 
  }),
}));