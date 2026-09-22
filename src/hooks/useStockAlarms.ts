// src/hooks/useStockAlarms.ts
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';

const NOTIFIED_KEY = 'cocinapp-notified-alarms';
const CHECK_INTERVAL_MS = 60_000; // 1 minuto

/** Lee del localStorage el set de ids ya notificados. */
function getNotifiedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/** Guarda en localStorage el set de ids ya notificados. */
function saveNotifiedIds(ids: Set<string>) {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids]));
  } catch {
    /* silently ignore quota errors */
  }
}

interface InsumoAlarma {
  id: string;
  nombre: string;
  cantidad: number;
  unidad_medida: string;
  fecha_alarma: string;
}

/**
 * Hook global de alarmas de stock.
 * - Corre cada 60s mientras estés logueado en el admin.
 * - Chequea también al cargar y al recuperar foco la pestaña.
 * - Dispara un toast persistente (no se auto-cierra) con la cantidad de alarmas vencidas.
 * - Se puede navegar a /admin/stock desde el toast.
 * - No repite notificaciones ya vistas (persistencia en localStorage).
 */
export function useStockAlarms() {
  const { restauranteId } = useAuthStore();
  const navigate = useNavigate();
  const pushToast = useToastStore((s) => s.push);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!restauranteId) return;

    let cancelled = false;

    const checkAlarms = async () => {
      if (cancelled) return;

      try {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from('insumos')
          .select('id, nombre, cantidad, unidad_medida, fecha_alarma')
          .eq('restaurante_id', restauranteId)
          .not('fecha_alarma', 'is', null)
          .lte('fecha_alarma', nowIso);

        if (error) throw error;

        const insumos = (data ?? []) as InsumoAlarma[];
        if (insumos.length === 0) return;

        const notified = getNotifiedIds();

        // Filtramos los que todavía no notificamos
        const pendientes = insumos.filter((i) => !notified.has(i.id));
        if (pendientes.length === 0) return;

        // Marcamos como notificados ANTES de disparar el toast
        pendientes.forEach((i) => notified.add(i.id));
        saveNotifiedIds(notified);

        // Un solo toast agregado, persistente (duration: 0 = no auto-cierra)
        const total = pendientes.length;
        const primero = pendientes[0];

        pushToast({
          title: total === 1
            ? `Alarma de stock: ${primero.nombre}`
            : `Tenés ${total} alarmas de stock vencidas`,
          description: total === 1
            ? `Quedan ${primero.cantidad} ${primero.unidad_medida}. Revisá la sección Stock.`
            : `El primero es "${primero.nombre}". Revisá la sección Stock para verlos todos.`,
          variant: 'error',
          duration: 0, // persistente hasta que el usuario lo cierre
        });

        // Log para debugging
        console.info('[useStockAlarms] Disparadas', total, 'alarmas:', pendientes.map((p) => p.nombre));
      } catch (err) {
        // No spameamos con toasts de error cada 60s si falla la red. Solo log.
        console.warn('[useStockAlarms] No pudimos chequear alarmas:', err);
      }
    };

    // Chequeo inicial
    checkAlarms();

    // Intervalo
    intervalRef.current = window.setInterval(checkAlarms, CHECK_INTERVAL_MS);

    // Chequeo al recuperar foco la pestaña (útil para usuarios que dejan la app en background)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAlarms();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Cleanup
    return () => {
      cancelled = true;
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [restauranteId, pushToast, navigate]);
}

/**
 * Limpia la marca de "notificado" de una alarma específica.
 * Útil cuando el usuario programa una nueva alarma sobre el mismo insumo,
 * para que se vuelva a disparar la notificación.
 */
export function clearNotifiedAlarm(insumoId: string) {
  const notified = getNotifiedIds();
  notified.delete(insumoId);
  saveNotifiedIds(notified);
}

/**
 * Limpia TODAS las marcas de "notificado".
 * Útil para debugging desde la consola: `clearAllNotifiedAlarms()`
 */
export function clearAllNotifiedAlarms() {
  localStorage.removeItem(NOTIFIED_KEY);
}