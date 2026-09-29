// src/pages/AdminRestaurant.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHint } from '@/components/ui/section-hint';
import {
  Loader2,
  Store,
  Link as LinkIcon,
  Palette,
  MessageSquare,
  Copy,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Smartphone,
  Search,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from '@/stores/useToastStore';

export default function AdminRestaurant() {
  const { restauranteId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    color_principal: '#4f46e5',
    color_fondo: '#f8fafc',
    color_tarjeta: '#ffffff',
    mensaje_bienvenida: '',
    logo_url: '',
  });

  useEffect(() => {
    if (restauranteId) fetchRestauranteInfo();
  }, [restauranteId]);

  const fetchRestauranteInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('id', restauranteId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          nombre: data.nombre || '',
          slug: data.slug || '',
          color_principal: data.color_principal || '#4f46e5',
          color_fondo: data.color_fondo || '#f8fafc',
          color_tarjeta: data.color_tarjeta || '#ffffff',
          mensaje_bienvenida: data.mensaje_bienvenida || '¡Bienvenidos a nuestro menú digital!',
          logo_url: data.logo_url || '',
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error al cargar datos del restaurante:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
    setFormData({ ...formData, slug: formattedSlug });
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const basePayload: Record<string, unknown> = {
        nombre: formData.nombre,
        slug: formData.slug || null,
        color_principal: formData.color_principal,
        color_fondo: formData.color_fondo,
        mensaje_bienvenida: formData.mensaje_bienvenida,
        logo_url: formData.logo_url.trim() || null,
      };

      // Intentamos guardar con color_tarjeta si existe en Supabase
      let { error } = await supabase
        .from('restaurantes')
        .update({
          ...basePayload,
          color_tarjeta: formData.color_tarjeta,
        })
        .eq('id', restauranteId);

      // Si la columna aún no fue migrada en la BD (código 42703 / error de columna inexistente), guardamos el resto
      if (error && (error.code === '42703' || error.message?.includes('color_tarjeta'))) {
        const fallback = await supabase
          .from('restaurantes')
          .update(basePayload)
          .eq('id', restauranteId);
        error = fallback.error;
      }

      if (error) {
        if (error.code === '23505') {
          toast.error(
            'Ese enlace ya está en uso',
            'Probá con otro slug (ej: "mi-restaurante-2").'
          );
          return;
        }
        throw error;
      }

      toast.success(
        'Configuración guardada',
        'Tus cambios ya están visibles en la carta digital.'
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error al guardar restaurante:', error);
      }
      toast.error(
        'No pudimos guardar los cambios',
        error instanceof Error ? error.message : 'Intentá de nuevo en unos segundos.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const publicUrl = formData.slug ? `${window.location.origin}/m/${formData.slug}` : '';

  const copyToClipboard = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* CABECERA CON SECTION HINT (UX-01) */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Perfil de Negocio</h2>
            <SectionHint text="Personalizá la identidad, logo y colores de tu Menú Digital en tiempo real. Obtené el enlace único para imprimir tu QR o compartir en redes." />
          </div>
          <p className="text-slate-500 text-sm">Personaliza la identidad y tu Menú Digital para tus clientes.</p>
        </div>
      </div>

      <form onSubmit={handleGuardar} className="space-y-6">
        {/* INFORMACIÓN GENERAL */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Store size={18} className="text-indigo-500" /> Información General
            </h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nombre del Restaurante
              </label>
              <Input
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                placeholder="Ej. La Trattoria"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ImageIcon size={16} /> URL del Logo (Opcional)
              </label>
              <Input
                placeholder="https://..."
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* PERSONALIZACIÓN DEL MENÚ DIGITAL + LIVE SMARTPHONE PREVIEW (UX-02) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Palette size={18} className="text-emerald-500" /> Personalización del Menú Digital
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Smartphone size={12} /> Preview en vivo
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <div className="lg:col-span-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <LinkIcon size={16} /> Enlace (Slug)
                </label>
                <div className="flex shadow-sm rounded-md">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sm:text-sm font-mono">
                    /m/
                  </span>
                  <Input
                    required
                    placeholder="mi-restaurante"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    className="rounded-none rounded-r-md font-mono dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MessageSquare size={16} /> Mensaje de Bienvenida
                </label>
                <Input
                  value={formData.mensaje_bienvenida}
                  onChange={(e) => setFormData({ ...formData, mensaje_bienvenida: e.target.value })}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  placeholder="¡Bienvenidos a nuestra carta digital!"
                />
              </div>

              {/* PALETA DE 3 COLORES: MARCA, FONDO, TARJETAS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Color Marca
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={formData.color_principal}
                      onChange={(e) => setFormData({ ...formData, color_principal: e.target.value })}
                      className="h-8 w-10 rounded border cursor-pointer dark:border-slate-700 bg-transparent"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formData.color_principal.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Color Fondo
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={formData.color_fondo}
                      onChange={(e) => setFormData({ ...formData, color_fondo: e.target.value })}
                      className="h-8 w-10 rounded border cursor-pointer dark:border-slate-700 bg-transparent"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formData.color_fondo.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Color Tarjetas
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={formData.color_tarjeta}
                      onChange={(e) => setFormData({ ...formData, color_tarjeta: e.target.value })}
                      className="h-8 w-10 rounded border cursor-pointer dark:border-slate-700 bg-transparent"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formData.color_tarjeta.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* ENLACE Y BOTONES DE COMPARTIR */}
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Tu Menú en Línea
                  </span>
                  {publicUrl && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Activo
                    </span>
                  )}
                </div>

                {publicUrl ? (
                  <div className="space-y-2">
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-indigo-600 dark:text-indigo-400 break-all select-all">
                      {publicUrl}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={copyToClipboard}
                        className="w-1/2 flex items-center justify-center gap-2 dark:border-slate-700 dark:text-slate-300 text-xs"
                      >
                        {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copied ? '¡Copiado!' : 'Copiar URL'}
                      </Button>
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="w-1/2">
                        <Button type="button" className="w-full bg-slate-900 dark:bg-indigo-600 text-white text-xs flex items-center justify-center gap-1.5">
                          Ver Carta <ExternalLink size={14} />
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg">
                    ⚠️ Ingresa un Enlace (Slug) para generar tu URL.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA: LIVE SMARTPHONE MOCKUP (UX-02) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="text-center mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Smartphone size={14} /> Vista Previa en Móvil
                </span>
                <p className="text-[11px] text-slate-400">Renderizado en tiempo real</p>
              </div>

              {/* Smartphone Frame */}
              <div className="w-[280px] sm:w-[310px] h-[500px] rounded-[38px] p-2.5 bg-slate-900 border-4 border-slate-700 dark:border-slate-800 shadow-2xl relative flex flex-col overflow-hidden select-none">
                {/* Dynamic Notch */}
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-800 mr-2"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900/50"></div>
                </div>

                {/* Inner Screen */}
                <div
                  className="w-full h-full rounded-[28px] overflow-y-auto overflow-x-hidden flex flex-col transition-colors duration-300 relative text-left"
                  style={{ backgroundColor: formData.color_fondo }}
                >
                  {/* Smartphone Header with dynamic color */}
                  <div
                    className="pt-8 pb-5 px-3 text-center text-white relative shadow-sm transition-colors duration-300"
                    style={{ backgroundColor: formData.color_principal }}
                  >
                    <div className="relative z-10 flex flex-col items-center">
                      {formData.logo_url ? (
                        <div className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden mb-2 bg-white">
                          <img
                            src={formData.logo_url}
                            alt="Logo"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : null}
                      <h4 className="text-base font-black leading-tight tracking-tight drop-shadow-sm">
                        {formData.nombre.trim() || 'Nombre de tu Local'}
                      </h4>
                      <p className="text-[10px] text-white/90 font-medium mt-0.5 line-clamp-2 leading-tight max-w-[200px]">
                        {formData.mensaje_bienvenida.trim() || '¡Bienvenidos a nuestra carta digital!'}
                      </p>
                    </div>
                  </div>

                  {/* Minimalist Search Bar in Preview */}
                  <div className="px-3 sticky top-1 z-20 mt-1.5">
                    <div className="bg-white/85 backdrop-blur-md rounded-lg shadow-2xs border border-slate-200/80 p-1.5 flex items-center gap-1.5">
                      <Search size={11} className="text-slate-400 ml-1" />
                      <span className="text-[10px] text-slate-400">Buscar plato o bebida...</span>
                    </div>
                  </div>

                  {/* Sample Menu Items with color_tarjeta */}
                  <div className="p-3 space-y-3 flex-1 text-slate-800">
                    <div>
                      <h5
                        className="text-[10px] font-black uppercase tracking-wider mb-1.5"
                        style={{ color: formData.color_principal }}
                      >
                        DESTACADOS
                      </h5>
                      <div className="space-y-2">
                        {/* Plato con foto */}
                        <div
                          className="rounded-xl p-2.5 shadow-2xs border border-black/5 flex items-center justify-between gap-2 transition-colors"
                          style={{ backgroundColor: formData.color_tarjeta }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-slate-800 truncate">Plato Especial</p>
                            <p className="text-[9px] text-slate-500 line-clamp-1">Ingredientes frescos y receta casera.</p>
                            <span className="text-xs font-black text-slate-900 mt-1 block">$ 6.500</span>
                          </div>
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-300 overflow-hidden">
                            <UtensilsCrossed size={16} />
                          </div>
                        </div>

                        {/* Plato sin foto (formato compacto tradicional) */}
                        <div
                          className="rounded-xl p-2.5 shadow-2xs border border-black/5 flex flex-col justify-between gap-1 transition-colors"
                          style={{ backgroundColor: formData.color_tarjeta }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-xs text-slate-800 truncate">Bebida Artesanal 500ml</p>
                            <span className="text-xs font-black text-slate-900">$ 2.800</span>
                          </div>
                          <p className="text-[9px] text-slate-500 line-clamp-1">Opción clásica o sin alcohol.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="py-2 text-center text-[9px] text-slate-400 border-t border-slate-200/50 bg-white/40 mt-auto">
                    Cocin<span className="font-bold text-indigo-500">App</span> Menú
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg border-0 font-bold"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null} Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}