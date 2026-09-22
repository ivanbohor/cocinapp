// src/pages/AdminRestaurant.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Store, Link as LinkIcon, Palette, MessageSquare, Copy, CheckCircle2, ExternalLink, Image as ImageIcon } from 'lucide-react';

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
    mensaje_bienvenida: '',
    logo_url: ''
  });

  useEffect(() => {
    if (restauranteId) fetchRestauranteInfo();
  }, [restauranteId]);

  const fetchRestauranteInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurantes')
        .select('nombre, slug, color_principal, color_fondo, mensaje_bienvenida, logo_url')
        .eq('id', restauranteId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          nombre: data.nombre || '',
          slug: data.slug || '',
          color_principal: data.color_principal || '#4f46e5',
          color_fondo: data.color_fondo || '#f8fafc',
          mensaje_bienvenida: data.mensaje_bienvenida || '¡Bienvenidos a nuestro menú digital!',
          logo_url: data.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error al cargar datos del restaurante:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    setFormData({ ...formData, slug: formattedSlug });
  };

  const handleGuardar = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    const { error } = await supabase
      .from('restaurantes')
      .update({
        nombre: formData.nombre,
        slug: formData.slug || null,
        color_principal: formData.color_principal,
        color_fondo: formData.color_fondo,
        mensaje_bienvenida: formData.mensaje_bienvenida,
        logo_url: formData.logo_url.trim() || null
      })
      .eq('id', restauranteId);

    if (error) {
      if (error.code === '23505') {
        // 🔄 OLA 2D: mensaje específico para slug duplicado
        toast.error(
          'Ese enlace ya está en uso',
          'Probá con otro slug (ej: "mi-restaurante-2").'
        );
        return;
      }
      throw error;
    }

    toast.success('Configuración guardada', 'Tus cambios ya están visibles en la carta digital.');
  } catch (error) {
    console.error('Error al guardar restaurante:', error);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Perfil de Negocio</h2>
        <p className="text-slate-500 text-sm">Personaliza la identidad y tu Menú Digital.</p>
      </div>

      <form onSubmit={handleGuardar} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Store size={18} className="text-indigo-500" /> Información General
            </h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              {/* CORRECCIÓN: Se añade text-slate-700 dark:text-slate-300 */}
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Restaurante</label>
              <Input required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1.5">
              {/* CORRECCIÓN: Se añade text-slate-700 dark:text-slate-300 */}
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"><ImageIcon size={16}/> URL del Logo (Opcional)</label>
              <Input placeholder="https://..." value={formData.logo_url} onChange={(e) => setFormData({...formData, logo_url: e.target.value})} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Palette size={18} className="text-emerald-500" /> Personalización del Menú Digital
            </h3>
          </div>
          
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="space-y-1.5">
                {/* CORRECCIÓN: Se añade text-slate-700 dark:text-slate-300 */}
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"><LinkIcon size={16}/> Enlace (Slug)</label>
                <div className="flex shadow-sm rounded-md">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sm:text-sm">/m/</span>
                  <Input required placeholder="mi-restaurante" value={formData.slug} onChange={handleSlugChange} className="rounded-none rounded-r-md font-mono dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                {/* CORRECCIÓN: Se añade text-slate-700 dark:text-slate-300 */}
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"><MessageSquare size={16}/> Mensaje de Bienvenida</label>
                <Input value={formData.mensaje_bienvenida} onChange={(e) => setFormData({...formData, mensaje_bienvenida: e.target.value})} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  {/* CORRECCIÓN: Se añade text-slate-700 dark:text-slate-300 */}
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Color Marca</label>
                  <input type="color" value={formData.color_principal} onChange={(e) => setFormData({...formData, color_principal: e.target.value})} className="h-10 w-full rounded border dark:border-slate-700 cursor-pointer" />
                </div>
                <div className="space-y-1.5">
                  {/* CORRECCIÓN: Se añade text-slate-700 dark:text-slate-300 */}
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Color Fondo</label>
                  <input type="color" value={formData.color_fondo} onChange={(e) => setFormData({...formData, color_fondo: e.target.value})} className="h-10 w-full rounded border dark:border-slate-700 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <ExternalLink size={32} className="mx-auto text-indigo-500" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">Tu Menú en Línea</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Comparte este enlace con tus clientes.</p>
              </div>
              {publicUrl ? (
                <div className="w-full">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 mb-3 font-mono text-sm text-indigo-600 dark:text-indigo-400 break-all select-all">{publicUrl}</div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={copyToClipboard} className="w-1/2 flex items-center gap-2 dark:border-slate-700 dark:text-slate-300">
                      {copied ? <CheckCircle2 size={16} className="text-emerald-500"/> : <Copy size={16}/>} Copiar
                    </Button>
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="w-1/2">
                      <Button type="button" className="w-full bg-slate-900 dark:bg-indigo-600 text-white">Ver Menú <ExternalLink size={16} className="ml-2"/></Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">⚠️ Ingresa un Enlace (Slug) para generar tu URL.</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg border-0">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null} Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}