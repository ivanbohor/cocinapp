// src/pages/AdminProducts.tsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from '@/stores/useToastStore';
import { confirm } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2 } from 'lucide-react';
import { ShareSuggestionsModal, type SavedShareOptions } from '@/components/modals/ShareSuggestionsModal';
import { SectionHint } from '@/components/ui/section-hint';
import {
  Loader2,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  Upload,
  Download,
  CheckSquare,
  Square,
  Sparkles,   // ← NUEVO (sugerencias)
  
} from 'lucide-react';
import { HelpPopover } from '@/components/ui/help-popover';
import { cn } from '@/lib/utils';
interface Producto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  status: string;
  image_url: string | null;
  es_sugerencia: boolean;   // ← NUEVO (sugerencias)
}

export default function AdminProducts() {
  const { restauranteId } = useAuthStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ordenGuardado, setOrdenGuardado] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [restauranteInfo, setRestauranteInfo] = useState<{
    nombre: string;
    slug: string;
    logo_url: string | null;
    color_principal: string;
    color_tarjeta: string;
    color_fondo: string;
    whatsapp: string | null;
    direccion: string | null;
    share_options: SavedShareOptions | null;
  }>({
    nombre: '',
    slug: '',
    logo_url: null,
    color_principal: '#f97316',
    color_tarjeta: '#ffffff',
    color_fondo: '#fbfaf7',
    whatsapp: null,
    direccion: null,
    share_options: null,
  });

    


  const [categoriasActivas, setCategoriasActivas] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Platos Principales',
    status: 'Activo',
    image_url: '',
    es_sugerencia: false,   // ← NUEVO (sugerencias)
  });

  useEffect(() => {
    if (restauranteId) fetchDatos();
  }, [restauranteId]);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .order('category', { ascending: true });
      if (prodError) throw prodError;

      const { data: restData } = await supabase
          .from('restaurantes')
           .select('orden_categorias, nombre, slug, logo_url, color_principal, color_tarjeta, color_fondo, whatsapp, direccion, share_options')
          .eq('id', restauranteId)
          .single();
          if (prodData) setProductos(prodData);
          if (restData) {
            if (restData.orden_categorias) setOrdenGuardado(restData.orden_categorias);
            setRestauranteInfo({
              nombre: restData.nombre || '',
              slug: restData.slug || '',
              logo_url: restData.logo_url || null,
              color_principal: restData.color_principal || '#f97316',
              color_tarjeta: restData.color_tarjeta || '#ffffff',
              color_fondo: restData.color_fondo || '#fbfaf7',
              whatsapp: restData.whatsapp || null,
              direccion: restData.direccion || null,
              share_options: (restData.share_options as SavedShareOptions | null) ?? null,
            });
          }
          

        

      
    } catch (error) {
      console.error('Error:', error);
      toast.error('No pudimos cargar el catálogo', error instanceof Error ? error.message : undefined);
    } finally {
      setLoading(false);
    }
    

  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        restaurante_id: restauranteId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        category: formData.category,
        status: formData.status,
        image_url: formData.image_url.trim() || null,
        es_sugerencia: formData.es_sugerencia,   // ← NUEVO (sugerencias)
      };

      if (activeId) {
        const { error } = await supabase.from('productos').update(payload).eq('id', activeId);
        if (error) throw error;
        setProductos(productos.map(p => p.id === activeId ? { ...p, ...payload } : p));
        toast.success('Producto actualizado', `"${payload.name}" se guardó correctamente.`);
      } else {
        const { data, error } = await supabase.from('productos').insert([payload]).select();
        if (error) throw error;
        if (data) setProductos([...productos, data[0]]);
        toast.success('Producto creado', `"${payload.name}" ya está disponible en tu carta.`);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        'No pudimos guardar el producto',
        error instanceof Error ? error.message : 'Revisá los datos e intentá de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async (id: string) => {
    const producto = productos.find(p => p.id === id);
    const ok = await confirm({
      title: 'Eliminar producto',
      description: `"${producto?.name ?? 'Este producto'}" dejará de aparecer en tu carta digital. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;

    const backup = productos;
    setProductos(productos.filter(p => p.id !== id));
    setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));

    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Producto eliminado');
    } catch (error) {
      console.error('Error al eliminar:', error);
      setProductos(backup);
      toast.error('No pudimos eliminar el producto', 'Intentá de nuevo en unos segundos.');
    }
  };

  const handleSaveShareOptions = async (options: SavedShareOptions) => {
  if (!restauranteId) return;
  try {
    const { error } = await supabase
      .from('restaurantes')
      .update({ share_options: options })
      .eq('id', restauranteId);
    if (error) throw error;

    setRestauranteInfo((prev) => ({ ...prev, share_options: options }));
  } catch (err) {
    console.error('No se pudieron guardar las preferencias de compartir:', err);
  }
};

  // ===============================================
  // SELECCIÓN MÚLTIPLE
  // ===============================================
  const filtered = productos.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    const ok = await confirm({
      title: `Eliminar ${selectedIds.length} producto${selectedIds.length > 1 ? 's' : ''}`,
      description: 'Esta acción no se puede deshacer. Los productos dejarán de aparecer en tu carta digital.',
      confirmLabel: 'Eliminar todos',
      destructive: true,
    });
    if (!ok) return;

    setIsSubmitting(true);
    const backup = productos;
    const backupSelected = selectedIds;

    setProductos(productos.filter(p => !selectedIds.includes(p.id)));
    setSelectedIds([]);

    try {
      const { error } = await supabase.from('productos').delete().in('id', backupSelected);
      if (error) throw error;
      toast.success(
        `${backupSelected.length} producto${backupSelected.length > 1 ? 's' : ''} eliminado${backupSelected.length > 1 ? 's' : ''}`,
      );
    } catch (error) {
      console.error('Error al eliminar seleccionados:', error);
      setProductos(backup);
      setSelectedIds(backupSelected);
      toast.error('No pudimos eliminar los productos seleccionados');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===============================================
  // EXPORTACIÓN CSV
  // ===============================================
  const handleExportCSV = () => {
    const headers = ['Nombre', 'Descripcion', 'Precio', 'Categoria', 'ImagenURL'];

    let rows: (string | number)[][];
    let esPlantillaVacia = false;

    if (filtered.length === 0) {
      // ✅ Plantilla vacía con fila de ejemplo para que el usuario entienda el formato
      esPlantillaVacia = true;
      rows = [
        [
          'Milanesa con papas',
          'Milanesa de carne con guarnición de papas fritas',
          12000,
          'Platos Principales',
          'https://ejemplo.com/milanesa.jpg',
        ],
        [
          'Coca-Cola 500ml',
          '',
          3500,
          'Bebidas',
          '',
        ],
      ];
    } else {
      rows = filtered.map((p) => [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        p.price,
        `"${p.category.replace(/"/g, '""')}"`,
        `"${(p.image_url || '').replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      esPlantillaVacia
        ? `plantilla_menu_cocinapp.csv`
        : `menu_cocinapp_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (esPlantillaVacia) {
      toast.info(
        'Plantilla descargada',
        'Completala en Excel y luego usá "Importar CSV" para subir tu menú.'
      );
    } else {
      toast.success(
        `${filtered.length} producto${filtered.length > 1 ? 's' : ''} exportado${filtered.length > 1 ? 's' : ''}`,
        'Revisá tu carpeta de descargas.'
      );
    }
  };

  // ===============================================
  // IMPORTACIÓN CSV
  // ===============================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      await procesarCSV(text);
    };
    reader.readAsText(file);
  };

  const procesarCSV = async (csvText: string) => {
    setIsSubmitting(true);
    try {
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        toast.error('El archivo está vacío', 'Asegurate de que tenga al menos una fila de datos.');
        return;
      }

      const separator = lines[0].includes(';') ? ';' : ',';

      const rechazados: number[] = [];
      const nuevosProductos = lines.slice(1).map((line, idx) => {
        const cols = line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
        const name = cols[0];
        const price = parseFloat(cols[2]);

        if (!name || isNaN(price)) {
          rechazados.push(idx + 2);
          return null;
        }

        return {
          restaurante_id: restauranteId,
          name,
          description: cols[1] || null,
          price,
          category: cols[3] || 'General',
          status: 'Activo',
          image_url: cols[4] || null
        };
      }).filter((p): p is NonNullable<typeof p> => p !== null);

      if (nuevosProductos.length === 0) {
        toast.error(
          'Ningún producto válido',
          'Verificá que el CSV tenga este orden: Nombre, Descripción, Precio, Categoría, ImagenURL.'
        );
        return;
      }

      const { data, error } = await supabase.from('productos').insert(nuevosProductos).select();
      if (error) throw error;

      if (data) setProductos(prev => [...prev, ...data]);

      if (rechazados.length > 0) {
        toast.warning(
          `${data?.length ?? 0} productos importados`,
          `${rechazados.length} fila${rechazados.length > 1 ? 's' : ''} rechazada${rechazados.length > 1 ? 's' : ''} (líneas ${rechazados.join(', ')}).`
        );
      } else {
        toast.success(
          `${data?.length ?? 0} producto${(data?.length ?? 0) > 1 ? 's' : ''} importado${(data?.length ?? 0) > 1 ? 's' : ''}`,
          'Ya están disponibles en tu catálogo.'
        );
      }
    } catch (error) {
      console.error('Error importando CSV:', error);
      toast.error(
        'Error al importar',
        'Verificá que el CSV tenga este orden: Nombre, Descripción, Precio, Categoría, ImagenURL.'
      );
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ===============================================
  // ORDENAMIENTO DE CATEGORÍAS
  // ===============================================
  const abrirModalOrden = () => {
    const categoriasUnicas = Array.from(new Set(productos.map(p => p.category)));
    const ordenadas = categoriasUnicas.sort((a, b) => {
      const indexA = ordenGuardado.indexOf(a);
      const indexB = ordenGuardado.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    setCategoriasActivas(ordenadas);
    setIsOrderModalOpen(true);
  };

  const moverCategoria = (index: number, direccion: 'arriba' | 'abajo') => {
    const nuevas = [...categoriasActivas];
    if (direccion === 'arriba' && index > 0) {
      [nuevas[index - 1], nuevas[index]] = [nuevas[index], nuevas[index - 1]];
    } else if (direccion === 'abajo' && index < nuevas.length - 1) {
      [nuevas[index + 1], nuevas[index]] = [nuevas[index], nuevas[index + 1]];
    }
    setCategoriasActivas(nuevas);
  };

  const guardarOrden = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('restaurantes')
        .update({ orden_categorias: categoriasActivas })
        .eq('id', restauranteId);
      if (error) throw error;
      setOrdenGuardado(categoriasActivas);
      setIsOrderModalOpen(false);
      toast.success('Orden de la carta guardado');
    } catch (error) {
      console.error('Error guardando orden:', error);
      toast.error('No pudimos guardar el orden', 'Intentá de nuevo en unos segundos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===============================================
  // HELPERS: Abrir modal en modo "nuevo" o "editar"
  // ===============================================
  const abrirModalNuevo = () => {
    setActiveId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Platos Principales',
      status: 'Activo',
      image_url: '',
      es_sugerencia: false,   // ← NUEVO (sugerencias)
    });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (prod: Producto) => {
    setActiveId(prod.id);
    setFormData({
      name: prod.name,
      description: prod.description || '',
      price: prod.price.toString(),
      category: prod.category,
      status: prod.status,
      image_url: prod.image_url || '',
      es_sugerencia: prod.es_sugerencia ?? false,   // ← NUEVO (sugerencias)
    });
    setIsModalOpen(true);
  };

  /* Toggle rápido de sugerencia desde la lista (sin abrir el modal) */
const toggleSugerencia = async (prod: Producto) => {
  const nuevoValor = !prod.es_sugerencia;

  // Optimistic
  const backup = productos;
  setProductos((prev) =>
    prev.map((p) => (p.id === prod.id ? { ...p, es_sugerencia: nuevoValor } : p))
  );

  try {
    const { error } = await supabase
      .from('productos')
      .update({ es_sugerencia: nuevoValor })
      .eq('id', prod.id);
    if (error) throw error;

    toast.success(
      nuevoValor ? 'Marcado como sugerencia' : 'Desmarcado',
      `"${prod.name}" ${nuevoValor ? 'aparecerá' : 'ya no aparecerá'} en Sugerencias del Chef.`
    );
  } catch (err) {
    console.error('Error al actualizar sugerencia:', err);
    setProductos(backup);
    toast.error('No pudimos actualizar la sugerencia');
  }
};



  const sugerenciasCount = productos.filter((p) => p.es_sugerencia).length;
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-ink-500 dark:text-ink-400">
        <Loader2 className="animate-spin mr-3" />
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-ink-900 dark:text-white">Menú y Productos</h2>
            <SectionHint text="Creá platos, modificá precios, subí fotos y organizá categorías. Los cambios se actualizan automáticamente en el Menú QR de tus comensales." />
          </div>
          <p className="text-ink-500 dark:text-ink-400 text-sm">Gestiona los platos de tu carta.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          
            <HelpPopover ariaLabel="Cómo cargar tu menú con Excel">
              <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-brand-500" />
                Cargá tu menú en 3 pasos
              </h3>

              <ol className="space-y-3 text-xs">
                <li className="flex gap-2.5">
                  <span className="shrink-0 grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 font-bold text-[10px]">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-ink-800 dark:text-ink-200">
                      Descargá la plantilla
                    </p>
                    <p className="text-ink-600 dark:text-ink-400 mt-0.5 leading-relaxed">
                      Hacé click en "Descargar CSV". Si todavía no tenés productos,
                      obtenés una plantilla vacía con ejemplos para completar.
                    </p>
                  </div>
                </li>

                <li className="flex gap-2.5">
                  <span className="shrink-0 grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 font-bold text-[10px]">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-ink-800 dark:text-ink-200">
                      Editala en Excel
                    </p>
                    <p className="text-ink-600 dark:text-ink-400 mt-0.5 leading-relaxed">
                      Agregá tus platos respetando las columnas. No cambies los encabezados.
                      Guardá el archivo como <span className="font-mono text-[10px]">.csv</span>.
                    </p>
                  </div>
                </li>

                <li className="flex gap-2.5">
                  <span className="shrink-0 grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 font-bold text-[10px]">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-ink-800 dark:text-ink-200">
                      Importá el archivo
                    </p>
                    <p className="text-ink-600 dark:text-ink-400 mt-0.5 leading-relaxed">
                      Usá "Importar CSV" para subirlo. Los platos válidos se agregan
                      automáticamente a tu carta.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="mt-3 pt-3 border-t border-ink-100 dark:border-ink-800">
                <p className="text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed">
                  <span className="font-semibold text-ink-700 dark:text-ink-300">
                    Columnas:
                  </span>{' '}
                  Nombre, Descripción, Precio, Categoría, ImagenURL
                </p>
              </div>
            </HelpPopover>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-100 border-ink-200 dark:border-ink-700"
            >
              <Download size={18} className="mr-2" />
              Descargar CSV
            </Button>
          

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-100 border-ink-200 dark:border-ink-700"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Upload size={18} className="mr-2" />}
            Importar CSV
          </Button>

          <Button
            variant="outline"
            onClick={abrirModalOrden}
            className="bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-100 border-ink-200 dark:border-ink-700"
          >
            <ListOrdered size={18} className="mr-2" /> Organizar Carta
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsShareModalOpen(true)}
            disabled={sugerenciasCount === 0}
            title={
              sugerenciasCount === 0
                ? 'Marcá platos como "Sugerencia del Chef" para habilitar esta opción'
                : `Compartir ${sugerenciasCount} sugerencia${sugerenciasCount > 1 ? 's' : ''}`
            }
            className="bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-100 border-ink-200 dark:border-ink-700
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 size={18} className="mr-2" />
            Compartir Sugerencias
          </Button>

          {/* ✅ CORREGIDO: se usa el helper abrirModalNuevo */}
          <Button onClick={abrirModalNuevo}>
            <Plus size={18} className="mr-2" /> Nuevo
          </Button>
        </div>
      </div>

      {/* Barra de acciones masivas */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 px-4 py-3 rounded-lg animate-in fade-in">
          <p className="text-sm font-semibold text-brand-900 dark:text-brand-200">
            {selectedIds.length} producto(s) seleccionado(s)
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={isSubmitting}
          >
            <Trash2 size={16} className="mr-2" /> Eliminar seleccionados
          </Button>
        </div>
      )}

      <div className="flex items-center bg-white p-2 rounded-lg border shadow-sm max-w-md dark:bg-ink-900 border-ink-200 dark:border-ink-800">
        <Search size={20} className="text-ink-400 mx-2" />
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 shadow-none dark:bg-ink-900 dark:text-white focus-visible:ring-0"
        />
      </div>

           {/* ← FIX responsive: contenedor con scroll horizontal */}

           {/* ══════════════════════════════════════════════════════════
    MOBILE (< lg): tarjetas verticales con acciones táctiles
    ══════════════════════════════════════════════════════════ */}
<div className="lg:hidden space-y-3">
  {/* Toolbar de selección */}
  {filtered.length > 0 && (
    <div className="flex items-center justify-between px-1">
      <button
        type="button"
        onClick={toggleSelectAll}
        className="flex items-center gap-2 text-xs font-medium text-ink-600 dark:text-ink-400"
      >
        {selectedIds.length === filtered.length && filtered.length > 0 ? (
          <CheckSquare size={16} className="text-brand-600 dark:text-brand-400" />
        ) : (
          <Square size={16} />
        )}
        {selectedIds.length === filtered.length && filtered.length > 0
          ? 'Deseleccionar todo'
          : 'Seleccionar todo'}
      </button>
      <span className="text-xs text-ink-500 dark:text-ink-400">
        {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
      </span>
    </div>
  )}

  {filtered.length === 0 && (
    <div className="text-center py-12 text-ink-500 dark:text-ink-400 text-sm bg-white dark:bg-ink-900 rounded-card border border-ink-200 dark:border-ink-800">
      {searchTerm
        ? `No hay productos que coincidan con "${searchTerm}"`
        : 'Todavía no cargaste ningún producto.'}
    </div>
  )}

  {filtered.map((prod) => {
    const isSelected = selectedIds.includes(prod.id);
    return (
      <article
        key={prod.id}
        className={cn(
          'rounded-card border bg-white dark:bg-ink-900 shadow-card overflow-hidden transition-colors',
          isSelected
            ? 'border-brand-300 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-950/20'
            : 'border-ink-200 dark:border-ink-800'
        )}
      >
        {/* Fila superior: checkbox + nombre clickeable + precio */}
        <div className="flex items-start gap-3 p-4 pb-2">
          <button
            type="button"
            onClick={() => toggleSelectOne(prod.id)}
            aria-label={isSelected ? 'Deseleccionar producto' : 'Seleccionar producto'}
            className="shrink-0 mt-0.5 text-ink-400 hover:text-ink-700 dark:hover:text-white"
          >
            {isSelected ? (
              <CheckSquare size={20} className="text-brand-600 dark:text-brand-400" />
            ) : (
              <Square size={20} />
            )}
          </button>

          <button
            type="button"
            onClick={() => abrirModalEditar(prod)}
            className="flex-1 min-w-0 text-left group"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm text-ink-900 dark:text-white leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {prod.name}
              </h3>
              <span className="font-black text-sm text-ink-900 dark:text-white shrink-0">
                ${prod.price.toLocaleString()}
              </span>
            </div>
            {prod.description && (
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 line-clamp-2 leading-relaxed">
                {prod.description}
              </p>
            )}
          </button>
        </div>

        {/* Fila central: badges */}
        <div className="flex items-center gap-2 px-4 pb-3 pl-11 flex-wrap">
          <span className="bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 px-2 py-0.5 rounded-md text-[10px] font-semibold">
            {prod.category}
          </span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
              prod.status === 'Activo'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400'
            )}
          >
            {prod.status}
          </span>
          {prod.es_sugerencia && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold uppercase">
              <Sparkles size={10} />
              Sugerencia
            </span>
          )}
        </div>

        {/* Fila inferior: acciones rápidas */}
        <div className="flex border-t border-ink-100 dark:border-ink-800">
          <button
            type="button"
            onClick={() => abrirModalEditar(prod)}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold 
                       text-ink-600 dark:text-ink-300 
                       hover:bg-ink-50 dark:hover:bg-ink-800 
                       active:bg-ink-100 dark:active:bg-ink-700
                       transition-colors"
          >
            <Edit size={16} />
            Editar
          </button>

          <div className="w-px bg-ink-100 dark:bg-ink-800" />

          <button
            type="button"
            onClick={() => toggleSugerencia(prod)}
            aria-label={prod.es_sugerencia ? 'Quitar de sugerencias' : 'Marcar como sugerencia'}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors',
              prod.es_sugerencia
                ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                : 'text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
            )}
          >
            <Sparkles size={16} className={prod.es_sugerencia ? 'fill-current' : ''} />
            {prod.es_sugerencia ? 'Destacado' : 'Destacar'}
          </button>

          <div className="w-px bg-ink-100 dark:bg-ink-800" />

          <button
            type="button"
            onClick={() => handleDelete(prod.id)}
            aria-label="Eliminar producto"
            className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold 
                       text-red-500 dark:text-red-400 
                       hover:bg-red-50 dark:hover:bg-red-950/30 
                       active:bg-red-100 dark:active:bg-red-950/50
                       transition-colors"
          >
            <Trash2 size={16} />
            Eliminar
          </button>
        </div>
      </article>
    );
  })}
</div>

{/* ══════════════════════════════════════════════════════════
    DESKTOP (lg+): tabla con nombre clickeable + toggle rápido
    ══════════════════════════════════════════════════════════ */}
    <div className="hidden lg:block bg-white dark:bg-ink-900 rounded-card border border-ink-200 dark:border-ink-800 shadow-card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-ink-50 dark:bg-ink-950/50 text-ink-700 dark:text-ink-300 border-b border-ink-200 dark:border-ink-800">
          <tr>
            <th className="px-4 py-4 w-10 text-center">
              <button
                onClick={toggleSelectAll}
                className="text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-white"
              >
                {filtered.length > 0 && selectedIds.length === filtered.length ? (
                  <CheckSquare size={18} className="text-brand-600 dark:text-brand-400" />
                ) : (
                  <Square size={18} />
                )}
              </button>
            </th>
            <th className="px-6 py-4">Producto</th>
            <th className="px-6 py-4">Categoría</th>
            <th className="px-6 py-4">Precio</th>
            <th className="px-6 py-4 text-center">Estado</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
          {filtered.map((prod) => {
            const isSelected = selectedIds.includes(prod.id);
            return (
              <tr
                key={prod.id}
                className={`hover:bg-ink-50 dark:hover:bg-ink-800/50 ${
                  isSelected ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''
                }`}
              >
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => toggleSelectOne(prod.id)}
                    className="text-ink-400 hover:text-ink-700 dark:hover:text-white"
                  >
                    {isSelected ? (
                      <CheckSquare size={18} className="text-brand-600 dark:text-brand-400" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </td>

                <td className="px-6 py-4">
                  {/* ✅ Nombre clickeable para editar */}
                  <button
                    type="button"
                    onClick={() => abrirModalEditar(prod)}
                    className="text-left group flex items-center gap-2 flex-wrap"
                    title="Click para editar"
                  >
                    <p className="font-bold dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:underline underline-offset-4 transition-colors">
                      {prod.name}
                    </p>
                    {prod.es_sugerencia && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider"
                        title="Sugerencia del Chef"
                      >
                        <Sparkles size={10} /> Sugerencia
                      </span>
                    )}
                  </button>
                  {prod.description && (
                    <p className="text-xs text-ink-500 dark:text-ink-400 truncate max-w-xs mt-0.5">
                      {prod.description}
                    </p>
                  )}
                </td>

                <td className="px-6 py-4">
                  <span className="bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 px-2.5 py-1 rounded-md text-xs font-medium border border-transparent dark:border-ink-700">
                    {prod.category}
                  </span>
                </td>
                <td className="px-6 py-4 font-black dark:text-white">
                  ${prod.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      prod.status === 'Activo'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400'
                    }`}
                  >
                    {prod.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-1">
                    {/* ✅ Toggle rápido de sugerencia */}
                    <button
                      type="button"
                      onClick={() => toggleSugerencia(prod)}
                      aria-label={
                        prod.es_sugerencia ? 'Quitar de sugerencias' : 'Marcar como sugerencia'
                      }
                      title={
                        prod.es_sugerencia ? 'Quitar de sugerencias' : 'Marcar como Sugerencia del Chef'
                      }
                      className={cn(
                        'grid h-8 w-8 place-items-center rounded-md transition-colors',
                        prod.es_sugerencia
                          ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                          : 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-amber-500'
                      )}
                    >
                      <Sparkles size={18} className={prod.es_sugerencia ? 'fill-current' : ''} />
                    </button>

                    {/* Editar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirModalEditar(prod)}
                      aria-label="Editar producto"
                      className="text-ink-400 hover:text-brand-500 h-8 w-8"
                    >
                      <Edit size={18} />
                    </Button>

                    {/* Eliminar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(prod.id)}
                      aria-label="Eliminar producto"
                      className="text-ink-400 hover:text-red-500 h-8 w-8"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

      

      {/* MODAL ORDENAR CATEGORÍAS */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-ink-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-900 rounded-card shadow-xl w-full max-w-sm overflow-hidden border border-ink-200 dark:border-ink-800">
            <div className="flex justify-between items-center p-5 border-b border-ink-100 dark:border-ink-800 bg-ink-50 dark:bg-ink-950/50">
              <h3 className="font-bold text-ink-800 dark:text-white">Organizar Carta</h3>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-ink-400 hover:text-ink-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
              <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Usa las flechas para elegir el orden en el que tus clientes verán las categorías en la carta web.</p>
              {categoriasActivas.map((cat, index) => (
                <div key={cat} className="flex justify-between items-center p-3 bg-ink-50 dark:bg-ink-800 rounded-lg border border-ink-200 dark:border-ink-700">
                  <span className="font-medium text-ink-700 dark:text-ink-200">{cat}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 dark:text-ink-300" onClick={() => moverCategoria(index, 'arriba')} disabled={index === 0}><ArrowUp size={16} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 dark:text-ink-300" onClick={() => moverCategoria(index, 'abajo')} disabled={index === categoriasActivas.length - 1}><ArrowDown size={16} /></Button>
                  </div>
                </div>
              ))}
              <Button onClick={guardarOrden} disabled={isSubmitting} className="w-full mt-4">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Orden'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR/EDITAR PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-ink-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-900 rounded-card shadow-xl w-full max-w-md overflow-hidden border border-ink-200 dark:border-ink-800">
            <div className="flex justify-between items-center p-5 border-b border-ink-100 dark:border-ink-800 bg-ink-50 dark:bg-ink-950/50">
              <h3 className="font-bold text-ink-900 dark:text-white">{activeId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium dark:text-ink-300">Nombre</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="dark:bg-ink-800 dark:text-white dark:border-ink-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium dark:text-ink-300">Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="flex w-full rounded-field border border-ink-200 bg-transparent px-3 py-2 text-sm outline-none resize-none dark:bg-ink-800 dark:text-white dark:border-ink-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium dark:text-ink-300">Precio ($)</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="dark:bg-ink-800 dark:text-white dark:border-ink-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium dark:text-ink-300">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="flex h-11 w-full rounded-field border border-ink-200 bg-transparent px-3 text-sm outline-none dark:bg-ink-800 dark:text-white dark:border-ink-700"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Pausado">Pausado</option>
                  </select>
                </div>
              </div>

              {/* ✅ NUEVO: Toggle es_sugerencia */}
              <label className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.es_sugerencia}
                  onChange={(e) => setFormData({ ...formData, es_sugerencia: e.target.checked })}
                  className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">
                      Marcar como Sugerencia del Chef
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Se destacará al inicio de tu carta digital.
                  </p>
                </div>
              </label>

              <div className="space-y-1.5">
                <label className="text-sm font-medium dark:text-ink-300">Categoría</label>
                <Input
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="dark:bg-ink-800 dark:text-white dark:border-ink-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium dark:text-ink-300">URL Imagen (Opcional)</label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="dark:bg-ink-800 dark:text-white dark:border-ink-700"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Guardar'}
              </Button>
            </form>
          </div>
        </div>
      )}


      <ShareSuggestionsModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          restaurante={restauranteInfo}
          sugerencias={productos
            .filter((p) => p.es_sugerencia)
            .map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              image_url: p.image_url,
            }))}
          initialOptions={restauranteInfo.share_options}
          onSaveOptions={handleSaveShareOptions}
        />

           

    </div>
  );
}