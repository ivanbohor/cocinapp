// src/pages/AdminInventario.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// CAMBIO CLAVE: Usamos íconos universales para evitar crasheos por versión
import { Loader2, Bell, CheckCircle, Trash2, Calendar, Package, AlertTriangle } from 'lucide-react';

interface Recordatorio {
  id: string;
  articulo: string;
  notas: string | null;
  fecha_aviso: string;
  estado: string;
}

export default function AdminInventario() {
  const { restauranteId } = useAuthStore();
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calcularFecha = (dias: number) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    articulo: '',
    notas: '',
    fecha_aviso: calcularFecha(3)
  });

  useEffect(() => {
    if (restauranteId) fetchRecordatorios();
  }, [restauranteId]);

  const fetchRecordatorios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recordatorios_stock')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .eq('estado', 'Pendiente')
        .order('fecha_aviso', { ascending: true });

      if (error) throw error;
      if (data) setRecordatorios(data);
    } catch (error) {
      console.error('Error al cargar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('recordatorios_stock')
        .insert([{
          restaurante_id: restauranteId,
          articulo: formData.articulo.trim(),
          notas: formData.notas.trim() || null,
          fecha_aviso: formData.fecha_aviso,
          estado: 'Pendiente'
        }])
        .select();

      if (error) throw error;

      if (data) {
        const nuevaLista = [...recordatorios, data[0]].sort((a, b) => 
          new Date(a.fecha_aviso).getTime() - new Date(b.fecha_aviso).getTime()
        );
        setRecordatorios(nuevaLista);
      }
      
      setFormData({ ...formData, articulo: '', notas: '' });
      
    } catch (error) {
      console.error('Error al guardar alerta:', error);
      alert('Hubo un error al programar la alerta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolver = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recordatorios_stock')
        .update({ estado: 'Resuelto' })
        .eq('id', id);
        
      if (error) throw error;
      setRecordatorios(recordatorios.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error al resolver:', error);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar esta alerta definitivamente?')) return;
    try {
      const { error } = await supabase.from('recordatorios_stock').delete().eq('id', id);
      if (error) throw error;
      setRecordatorios(recordatorios.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const esUrgente = (fechaAviso: string) => {
    const hoy = new Date().toISOString().split('T')[0];
    return fechaAviso <= hoy;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <p>Cargando alertas de inventario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Alertas de Reposición</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Programa recordatorios inteligentes para no quedarte sin stock.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-amber-500" /> Nueva Alerta
              </h3>
            </div>
            
            <form onSubmit={handleGuardar} className="p-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Insumo / Artículo</label>
                <Input 
                  required 
                  placeholder="Ej: Cajas, Carne, Bebidas..."
                  value={formData.articulo}
                  onChange={(e) => setFormData({...formData, articulo: e.target.value})}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">¿Cuándo te avisamos?</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Button type="button" variant="outline" size="sm" className="text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" onClick={() => setFormData({...formData, fecha_aviso: calcularFecha(1)})}>
                    Mañana
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" onClick={() => setFormData({...formData, fecha_aviso: calcularFecha(3)})}>
                    3 Días
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" onClick={() => setFormData({...formData, fecha_aviso: calcularFecha(7)})}>
                    1 Semana
                  </Button>
                </div>
                
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    required 
                    type="date"
                    value={formData.fecha_aviso}
                    onChange={(e) => setFormData({...formData, fecha_aviso: e.target.value})}
                    className="pl-9 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notas (Opcional)</label>
                <Input 
                  placeholder="Ej: Llamar al proveedor (112233)"
                  value={formData.notas}
                  onChange={(e) => setFormData({...formData, notas: e.target.value})}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 dark:bg-indigo-600 text-white">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Programar Alerta'}
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {recordatorios.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm h-full flex flex-col items-center justify-center">
              <Package className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Todo en Orden</h3>
              <p className="text-slate-500 dark:text-slate-400">No tienes alertas de reposición pendientes.</p>
            </div>
          ) : (
            recordatorios.map((rec) => {
              const urgente = esUrgente(rec.fecha_aviso);
              return (
                <div 
                  key={rec.id} 
                  className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border-l-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors
                    ${urgente ? 'border-l-red-500 border-t-red-100 border-r-red-100 border-b-red-100 dark:border-y-slate-800 dark:border-r-slate-800' : 'border-l-indigo-500 border-t-slate-200 border-r-slate-200 border-b-slate-200 dark:border-y-slate-800 dark:border-r-slate-800'}
                  `}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {urgente && <AlertTriangle size={16} className="text-red-500 animate-pulse" />}
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">{rec.articulo}</h4>
                    </div>
                    {rec.notas && <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{rec.notas}</p>}
                    
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      urgente ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {urgente ? '¡Reponer Hoy!' : `Fecha Límite: ${new Date(rec.fecha_aviso).toLocaleDateString()}`}
                    </span>
                  </div>

                  <div className="flex gap-2 self-end sm:self-auto">
                    <Button variant="ghost" size="icon" onClick={() => handleEliminar(rec.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                      <Trash2 size={18} />
                    </Button>
                    <Button onClick={() => handleResolver(rec.id)} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50">
                      <CheckCircle size={18} className="mr-2" /> ¡Comprado!
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}