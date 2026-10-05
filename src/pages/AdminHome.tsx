// src/pages/AdminHome.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from '@/stores/useToastStore';
import { ShortcutsEditor, type SeccionShortcut } from '@/components/modals/ShortcutsEditor';
import {
  Loader2, Plus, Utensils, ShoppingCart, Table, Receipt,
  Wallet, Package, BarChart3, Settings, Sparkles, ArrowRight,
} from 'lucide-react';

/** Catálogo completo de secciones disponibles como atajos */
const SECCIONES: SeccionShortcut[] = [
  {
    id: 'productos',
    label: 'Menú y Productos',
    descripcion: 'Agregá o pausá un plato. Compartí tus sugerencias.',
    icon: Utensils,
    colorClass: 'text-brand-600 dark:text-brand-400',
    bgClass: 'bg-brand-100 dark:bg-brand-950/40',
  },
  {
    id: 'pos',
    label: 'Caja POS',
    descripcion: 'Cobrá o hacé una cuenta rápidamente.',
    icon: ShoppingCart,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-950/40',
  },
  {
    id: 'mesas',
    label: 'Gestión de Mesas',
    descripcion: 'Mirá el estado del salón en tiempo real.',
    icon: Table,
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-100 dark:bg-sky-950/40',
  },
  {
    id: 'ventas',
    label: 'Historial de Ventas',
    descripcion: 'Auditá tickets y métodos de pago.',
    icon: Receipt,
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-100 dark:bg-violet-950/40',
  },
  {
    id: 'gastos',
    label: 'Control de Gastos',
    descripcion: 'Registrá y categorizá tus egresos.',
    icon: Wallet,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-950/40',
  },
  {
    id: 'stock',
    label: 'Stock y Alertas',
    descripcion: 'Gestioná insumos y programá avisos.',
    icon: Package,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-950/40',
  },
  {
    id: 'dashboard',
    label: 'Resumen Financiero',
    descripcion: 'Analizá ingresos, gastos y ganancia.',
    icon: BarChart3,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-100 dark:bg-indigo-950/40',
  },
  {
    id: 'configuracion',
    label: 'Perfil de Negocio',
    descripcion: 'Personalizá tu carta y tus colores.',
    icon: Settings,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-100 dark:bg-rose-950/40',
  },
];

/** Rutas por id */
const PATH_BY_ID: Record<string, string> = {
  productos: '/admin/productos',
  pos: '/pos',
  mesas: '/admin/mesas',
  ventas: '/admin/ventas',
  gastos: '/admin/gastos',
  stock: '/admin/stock',
  dashboard: '/admin/dashboard',
  configuracion: '/admin/configuracion',
};

const DEFAULT_SHORTCUTS = ['productos', 'pos'];
const MAX_SHORTCUTS = 6;

export default function AdminHome() {
  const { restauranteId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [shortcutIds, setShortcutIds] = useState<string[]>(DEFAULT_SHORTCUTS);
  const [restauranteNombre, setRestauranteNombre] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (restauranteId) fetchData();
  }, [restauranteId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurantes')
        .select('nombre, home_shortcuts')
        .eq('id', restauranteId)
        .single();
      if (error) throw error;
      if (data) {
        setRestauranteNombre(data.nombre || '');
        if (Array.isArray(data.home_shortcuts) && data.home_shortcuts.length > 0) {
          // Filtrar ids desconocidos por si el schema cambió
          const valid = (data.home_shortcuts as string[]).filter((id) =>
            SECCIONES.some((s) => s.id === id)
          );
          setShortcutIds(valid.length > 0 ? valid : DEFAULT_SHORTCUTS);
        } else {
          setShortcutIds(DEFAULT_SHORTCUTS);
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      toast.error('No pudimos cargar tu inicio', 'Recargá la página o intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const guardarAtajos = async (nuevos: string[]) => {
    setIsSaving(true);
    const backup = shortcutIds;
    setShortcutIds(nuevos);
    try {
      const { error } = await supabase
        .from('restaurantes')
        .update({ home_shortcuts: nuevos })
        .eq('id', restauranteId);
      if (error) throw error;
      toast.success('Inicio actualizado', 'Tus atajos se guardaron correctamente.');
      setIsEditorOpen(false);
    } catch (err) {
      console.error(err);
      setShortcutIds(backup);
      toast.error('No pudimos guardar los atajos', 'Intentá de nuevo en unos segundos.');
    } finally {
      setIsSaving(false);
    }
  };

  const saludo = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const shortcutsActivos = SECCIONES.filter((s) => shortcutIds.includes(s.id));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-ink-500 dark:text-ink-400">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        Cargando tu inicio...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header de bienvenida */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          <Sparkles size={14} aria-hidden="true" />
          <span>Tu panel</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">
          {saludo}{restauranteNombre ? `, ${restauranteNombre}` : ''}
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Elegí por dónde empezar. Podés personalizar tus atajos cuando quieras.
        </p>
      </header>

      {/* Grid de atajos */}
      <section
        aria-label="Accesos rápidos"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {shortcutsActivos.map((seccion) => {
          const Icon = seccion.icon;
          return (
            <Link
              key={seccion.id}
              to={PATH_BY_ID[seccion.id]}
              className="group relative flex flex-col gap-4 rounded-card border border-ink-200 dark:border-ink-800 
                         bg-white dark:bg-ink-900 p-5 shadow-card
                         transition-all duration-200 
                         hover:-translate-y-0.5 hover:shadow-lg hover:border-ink-300 dark:hover:border-ink-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-xl ${seccion.bgClass} ${seccion.colorClass} shrink-0`}
                >
                  <Icon size={22} strokeWidth={2} aria-hidden="true" />
                </div>
                <ArrowRight
                  size={18}
                  className="text-ink-300 dark:text-ink-600 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-500 dark:group-hover:text-ink-400 mt-1"
                  aria-hidden="true"
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">
                  {seccion.label}
                </h3>
                <p className="text-sm text-ink-500 dark:text-ink-400 leading-snug">
                  {seccion.descripcion}
                </p>
              </div>
            </Link>
          );
        })}

        {/* Bloque "+ Agregar atajo" */}
        {shortcutIds.length < MAX_SHORTCUTS && (
          <button
            type="button"
            onClick={() => setIsEditorOpen(true)}
            className="group flex flex-col items-center justify-center gap-3 rounded-card 
                       border-2 border-dashed border-ink-300 dark:border-ink-700 
                       bg-ink-50/50 dark:bg-ink-950/30 p-6 min-h-[140px]
                       text-ink-500 dark:text-ink-400
                       transition-all duration-200 
                       hover:border-brand-400 dark:hover:border-brand-600 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 hover:text-brand-600 dark:hover:text-brand-400
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl border-2 border-current opacity-70 group-hover:opacity-100 transition-opacity">
              <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Agregar atajo</p>
              <p className="text-xs opacity-70 mt-0.5">Sumá secciones a tu inicio</p>
            </div>
          </button>
        )}
      </section>

      {/* Modal de personalización */}
      <ShortcutsEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        secciones={SECCIONES}
        activeIds={shortcutIds}
        max={MAX_SHORTCUTS}
        onSave={guardarAtajos}
        isSaving={isSaving}
      />
    </div>
  );
}