// src/pages/AdminRestaurant.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHint } from '@/components/ui/section-hint';
import {
  Loader2, Store, Link as LinkIcon, Palette, MessageSquare,
  Copy, CheckCircle2, ExternalLink, Image as ImageIcon,
  Smartphone, Search, UtensilsCrossed, Sparkles, Phone,
  MapPin, QrCode, Type as TypeIcon, ImagePlus,
} from 'lucide-react';
import { ContactIcon, CONTACT_COLORS,CONTACT_SHORT_LABELS, type Contacto } from '@/components/icons/contact-icons';
// Al inicio del archivo, junto a los demás imports
import { toast } from '@/stores/useToastStore';
import { QRModal } from '@/components/modals/QRModal';
import { ContactosEditor } from '@/components/forms/ContactosEditor';


type ColorTexto = 'auto' | 'oscuro' | 'claro';
type FondoTipo = 'color' | 'imagen';

export default function AdminRestaurant() {
  const { restauranteId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    direccion: '',                    // ← NUEVO
    color_principal: '#4f46e5',
    color_fondo: '#f8fafc',
    color_tarjeta: '#ffffff',
    color_texto: 'auto' as ColorTexto, // ← NUEVO
    fondo_tipo: 'color' as FondoTipo,  // ← NUEVO
    fondo_imagen_url: '',              // ← NUEVO
    mensaje_bienvenida: '',
    logo_url: '',
    mostrar_sugerencias: true,
  });

  // ← NUEVO: contactos dinámicos
  const [contactos, setContactos] = useState<Contacto[]>([]);

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
          direccion: data.direccion || '',
          color_principal: data.color_principal || '#4f46e5',
          color_fondo: data.color_fondo || '#f8fafc',
          color_tarjeta: data.color_tarjeta || '#ffffff',
          color_texto: (data.color_texto as ColorTexto) || 'auto',
          fondo_tipo: (data.fondo_tipo as FondoTipo) || 'color',
          fondo_imagen_url: data.fondo_imagen_url || '',
          mensaje_bienvenida: data.mensaje_bienvenida || '¡Bienvenidos a nuestro menú digital!',
          logo_url: data.logo_url || '',
          mostrar_sugerencias: data.mostrar_sugerencias ?? true,
        });

        // ← NUEVO: cargar contactos (con migración transparente)
        let loadedContacts: Contacto[] = [];
        if (Array.isArray(data.contactos) && data.contactos.length > 0) {
          loadedContacts = data.contactos as Contacto[];
        } else {
          // Migración: si tiene whatsapp/instagram viejos, los pasamos al formato nuevo
          if (data.whatsapp) {
            loadedContacts.push({
              id: crypto.randomUUID(),
              tipo: 'whatsapp',
              valor: data.whatsapp,
              label: '',
            });
          }
          if (data.instagram) {
            loadedContacts.push({
              id: crypto.randomUUID(),
              tipo: 'instagram',
              valor: data.instagram,
              label: '',
            });
          }
        }
        setContactos(loadedContacts);
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
      // ← NUEVO: filtrar contactos incompletos antes de guardar
      const contactosLimpios = contactos.filter((c) => c.valor.trim() !== '');

      const fullPayload: Record<string, unknown> = {
        nombre: formData.nombre,
        slug: formData.slug || null,
        direccion: formData.direccion.trim() || null,
        color_principal: formData.color_principal,
        color_fondo: formData.color_fondo,
        color_tarjeta: formData.color_tarjeta,
        color_texto: formData.color_texto,
        fondo_tipo: formData.fondo_tipo,
        fondo_imagen_url: formData.fondo_imagen_url.trim() || null,
        mensaje_bienvenida: formData.mensaje_bienvenida,
        logo_url: formData.logo_url.trim() || null,
        mostrar_sugerencias: formData.mostrar_sugerencias,
        contactos: contactosLimpios,
      };

      let { error } = await supabase
        .from('restaurantes')
        .update(fullPayload)
        .eq('id', restauranteId);

      // Fallback si alguna columna nueva no existe
      if (error && (error.code === '42703' || error.message?.includes('column'))) {
        const safePayload = { ...fullPayload };
        delete safePayload.color_tarjeta;
        delete safePayload.direccion;
        delete safePayload.color_texto;
        delete safePayload.fondo_tipo;
        delete safePayload.fondo_imagen_url;
        delete safePayload.contactos;

        const fallback = await supabase
          .from('restaurantes')
          .update(safePayload)
          .eq('id', restauranteId);
        error = fallback.error;
      }

      if (error) {
        if (error.code === '23505') {
          toast.error('Ese enlace ya está en uso', 'Probá con otro slug (ej: "mi-restaurante-2").');
          return;
        }
        throw error;
      }

      // Sincronizar contactos filtrados al estado local
      setContactos(contactosLimpios);

      toast.success('Configuración guardada', 'Tus cambios ya están visibles en la carta digital.');
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

  // Estilo del header del mockup según fondo_tipo
  const headerStyle: React.CSSProperties =
    formData.fondo_tipo === 'imagen' && formData.fondo_imagen_url
      ? {
          backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url("${formData.fondo_imagen_url}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : { backgroundColor: formData.color_principal };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* CABECERA */}
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

            {/* ← NUEVO: Dirección */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin size={16} /> Dirección (Opcional)
              </label>
              <Input
                placeholder="Av. Corrientes 1234, CABA"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
              <p className="text-xs text-slate-400">
                Se mostrará debajo de tu nombre en la carta digital.
              </p>
            </div>
          </div>
        </div>

        {/* CONTACTO Y REDES — DINÁMICO */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Phone size={18} className="text-sky-500" /> Contacto y Redes
              <span className="ml-auto text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Opcional
              </span>
            </h3>
          </div>
          <div className="p-5">
            <ContactosEditor contactos={contactos} onChange={setContactos} />
          </div>
        </div>

        {/* PERSONALIZACIÓN DEL MENÚ DIGITAL */}
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

              {/* COLOR DE MARCA — AHORA CON OPCIÓN DE FONDO POR IMAGEN */}
              <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Palette size={14} /> Encabezado de la Carta
                </label>

                {/* Selector de tipo: color vs imagen */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, fondo_tipo: 'color' })}
                    className={`text-xs font-medium rounded-field border px-3 py-2 transition-colors ${
                      formData.fondo_tipo === 'color'
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-700'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Color sólido
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, fondo_tipo: 'imagen' })}
                    className={`text-xs font-medium rounded-field border px-3 py-2 transition-colors flex items-center justify-center gap-1.5 ${
                      formData.fondo_tipo === 'imagen'
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-700'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ImagePlus size={12} /> Imagen
                  </button>
                </div>

                {/* Contenido condicional */}
                {formData.fondo_tipo === 'color' ? (
                  <div className="flex items-center gap-2">
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
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="https://ejemplo.com/fondo.jpg"
                      value={formData.fondo_imagen_url}
                      onChange={(e) => setFormData({ ...formData, fondo_imagen_url: e.target.value })}
                      className="dark:bg-slate-900 dark:border-slate-700 dark:text-white text-xs"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Se aplicará un overlay oscuro sobre la imagen para garantizar
                      la legibilidad del texto.
                    </p>
                  </div>
                )}
              </div>

              {/* PALETA: FONDO + TARJETAS + TEXTO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                {/* ← NUEVO: Color de texto */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <TypeIcon size={12} /> Texto
                  </label>
                  <select
                    value={formData.color_texto}
                    onChange={(e) =>
                      setFormData({ ...formData, color_texto: e.target.value as ColorTexto })
                    }
                    className="h-8 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs dark:text-white outline-none mt-1"
                  >
                    <option value="auto">Automático</option>
                    <option value="oscuro">Oscuro</option>
                    <option value="claro">Claro</option>
                  </select>
                </div>
              </div>

              {/* TOGGLE: MOSTRAR SUGERENCIAS */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        Mostrar Sugerencias del Chef
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                        Destacá platos al inicio de tu carta. Ideal para promociones del día.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.mostrar_sugerencias}
                    aria-label="Mostrar sugerencias del chef"
                    onClick={() =>
                      setFormData({ ...formData, mostrar_sugerencias: !formData.mostrar_sugerencias })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 ${
                      formData.mostrar_sugerencias ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                        formData.mostrar_sugerencias ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsQRModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:text-brand-800 dark:border-brand-900/50 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:bg-brand-950/50 text-xs font-semibold"
                    >
                      <QrCode size={14} />
                      Generar QR para imprimir
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg">
                    ⚠️ Ingresa un Enlace (Slug) para generar tu URL.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA: LIVE SMARTPHONE MOCKUP */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="text-center mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Smartphone size={14} /> Vista Previa en Móvil
                </span>
                <p className="text-[11px] text-slate-400">Renderizado en tiempo real</p>
              </div>

              <div className="w-[280px] sm:w-[310px] h-[500px] rounded-[38px] p-2.5 bg-slate-900 border-4 border-slate-700 dark:border-slate-800 shadow-2xl relative flex flex-col overflow-hidden select-none">
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-800 mr-2"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900/50"></div>
                </div>

                <div
                  className="w-full h-full rounded-[28px] overflow-y-auto overflow-x-hidden flex flex-col transition-colors duration-300 relative text-left"
                  style={{ backgroundColor: formData.color_fondo }}
                >
                  {/* Header dinámico (color o imagen) */}
                  <div
                    className="pt-8 pb-5 px-3 text-center text-white relative shadow-sm transition-all duration-300"
                    style={headerStyle}
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

                      {/* ← NUEVO: Dirección en el header */}
                      {formData.direccion.trim() && (
                        <p className="text-[9px] text-white/80 font-medium mt-1 flex items-center gap-1">
                          <MapPin size={9} /> {formData.direccion}
                        </p>
                      )}

                      <p className="text-[10px] text-white/90 font-medium mt-1 line-clamp-2 leading-tight max-w-[200px]">
                        {formData.mensaje_bienvenida.trim() || '¡Bienvenidos a nuestra carta digital!'}
                      </p>


                      {contactos.filter((c) => c.valor.trim()).length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
                          {contactos
                            .filter((c) => c.valor.trim())
                            .slice(0, 4)
                            .map((c) => {
                              const shortLabel =
                                c.label?.trim() ||
                                CONTACT_SHORT_LABELS[c.tipo] ||
                                'Contacto';
                              const color = CONTACT_COLORS[c.tipo] || '#64748b';

                              return (
                                <span
                                  key={c.id}
                                  className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-white shadow-sm"
                                  style={{ backgroundColor: color }}
                                >
                                  <ContactIcon tipo={c.tipo} size={9} />
                                  <span className="text-[8px] font-semibold whitespace-nowrap">
                                    {shortLabel}
                                  </span>
                                </span>
                              );
                            })}
                        </div>
                      )}

                   
                  

                     
                    </div>
                  </div>

                  <div className="px-3 sticky top-1 z-20 mt-1.5">
                    <div className="bg-white/85 backdrop-blur-md rounded-lg shadow-2xs border border-slate-200/80 p-1.5 flex items-center gap-1.5">
                      <Search size={11} className="text-slate-400 ml-1" />
                      <span className="text-[10px] text-slate-400">Buscar plato o bebida...</span>
                    </div>
                  </div>

                  {formData.mostrar_sugerencias && (
                    <div className="p-3 pb-0">
                      <div
                        className="rounded-lg p-2.5 shadow-2xs"
                        style={{ backgroundColor: formData.color_principal }}
                      >
                        <div className="flex items-center gap-1 mb-1.5">
                          <Sparkles size={10} className="text-white/80" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-white/90">
                            Sugerencias
                          </span>
                        </div>
                        <div
                          className="rounded-md p-1.5"
                          style={{ backgroundColor: formData.color_tarjeta }}
                        >
                          <p className="font-bold text-[10px] text-slate-800">Plato sugerido</p>
                          <span className="text-[10px] font-black text-slate-900">$ 7.500</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3 space-y-3 flex-1 text-slate-800">
                    <div>
                      <h5
                        className="text-[10px] font-black uppercase tracking-wider mb-1.5"
                        style={{ color: formData.color_principal }}
                      >
                        DESTACADOS
                      </h5>
                      <div className="space-y-2">
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
        <div className="flex justify-center sm:justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full sm:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg border-0 font-bold"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null} Guardar Configuración
          </Button>
        </div>
      </form>

      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        url={publicUrl}
        nombreRestaurante={formData.nombre}
        logoUrl={formData.logo_url || null}
      />
    </div>
  );
}

