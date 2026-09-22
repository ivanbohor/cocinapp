// src/hooks/useIsolateTheme.ts
import { useEffect } from 'react';

export function useIsolateTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');

    // Forzamos modo claro en esta vista
    if (wasDark) root.classList.remove('dark');

    return () => {
      // Restauramos el estado original al desmontar
      if (wasDark) root.classList.add('dark');
    };
  }, []);
}