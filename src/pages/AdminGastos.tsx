// src/pages/AdminGastos.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from '@/stores/useToastStore';
import { confirm } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, TrendingDown, Receipt, Wallet, Trash2, Calendar, Plus } from 'lucide-react';

interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  tipo_gasto: string;
  fecha: string;
}

export default function AdminGastos() {
  const { restauranteId } = useAuthStore();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    tipo_gasto: 'Insumo',
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (restauranteId) fetchGastos();
  }, [restauranteId]);

  const fetchGastos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .order('fecha', { ascending: false });

      if (error) throw error;
      if (data) setGastos(data);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      toast.error('No pudimos cargar los gastos', error instanceof Error ? error.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        restaurante_id: restauranteId,
        descripcion: formData.descripcion.trim(),
        monto: parseFloat(formData.monto),
        tipo_gasto: formData.tipo_gasto,
        fecha: formData.fecha
      };

      const { data, error } = await supabase.from('gastos').insert([payload]).select();
      if (error) throw error;

      if (data) setGastos([data[0], ...gastos]);
      setFormData({ ...formData, descripcion: '', monto: '' });

      toast.success('Gasto registrado', `"${payload.descripcion}" se agregó al historial.`);
    } catch (error) {
      console.error('Error al guardar gasto:', error);
      toast.error(
        'No pudimos registrar el gasto',
        error instanceof Error ? error.message : 'Revisá los datos e intentá de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminarGasto = async (id: string) => {
    const gasto = gastos.find(g => g.id === id);

    const ok = await confirm({
      title: 'Eliminar gasto',
      description: `"${gasto?.descripcion ?? 'Este registro'}" se eliminará del historial. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;

    const backup = gastos;
    setGastos(gastos.filter(g => g.id !== id));

    try {
      const { error } = await supabase.from('gastos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Gasto eliminado');
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      setGastos(backup);
      toast.error('No pudimos eliminar el gasto', 'Intentá de nuevo en unos segundos.');
    }
  };

  const totalGastos = gastos.reduce((acc, curr) => acc + Number(curr.monto), 0);
  const totalInsumos = gastos.filter(g => g.tipo_gasto === 'Insumo').reduce((acc, curr) => acc + Number(curr.monto), 0);
  const totalFijos = gastos.filter(g => g.tipo_gasto === 'Fijo').reduce((acc, curr) => acc + Number(curr.monto), 0);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-ink-500 dark:text-ink-400">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <p>Cargando registros financieros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      <div>
        <h2 className="text-2xl font-bold text-ink-800 dark:text-white">Control de Gastos</h2>
        <p className="text-ink-500 dark:text-ink-400 text-sm">Registra y categoriza los egresos de tu negocio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-ink-900 p-6 rounded-card border border-ink-200 dark:border-ink-800 shadow-card flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><TrendingDown size={24} /></div>
          <div><p className="text-sm font-medium text-ink-500 dark:text-ink-400">Total Gastos</p><h3 className="text-2xl font-black text-ink-900 dark:text-white">${totalGastos.toLocaleString()}</h3></div>
        </div>
        <div className="bg-white dark:bg-ink-900 p-6 rounded-card border border-ink-200 dark:border-ink-800 shadow-card flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg"><Receipt size={24} /></div>
          <div><p className="text-sm font-medium text-ink-500 dark:text-ink-400">Gasto en Insumos</p><h3 className="text-xl font-bold text-ink-900 dark:text-white">${totalInsumos.toLocaleString()}</h3></div>
        </div>
        <div className="bg-white dark:bg-ink-900 p-6 rounded-card border border-ink-200 dark:border-ink-800 shadow-card flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Wallet size={24} /></div>
          <div><p className="text-sm font-medium text-ink-500 dark:text-ink-400">Gastos Fijos</p><h3 className="text-xl font-bold text-ink-900 dark:text-white">${totalFijos.toLocaleString()}</h3></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-ink-900 rounded-card border border-ink-200 dark:border-ink-800 shadow-card overflow-hidden">
            <div className="p-4 border-b border-ink-100 dark:border-ink-800 bg-ink-50 dark:bg-ink-950/50">
              <h3 className="font-bold text-ink-800 dark:text-white flex items-center gap-2"><Plus size={18} /> Nuevo Gasto</h3>
            </div>
            <form onSubmit={handleGuardarGasto} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink-700 dark:text-ink-300">Descripción</label>
                <Input required placeholder="Ej: Pago de Luz..." value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} className="dark:bg-ink-800 dark:border-ink-700 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink-700 dark:text-ink-300">Monto ($)</label>
                  <Input required type="number" min="0" step="0.01" value={formData.monto} onChange={(e) => setFormData({...formData, monto: e.target.value})} className="dark:bg-ink-800 dark:border-ink-700 dark:text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink-700 dark:text-ink-300">Categoría</label>
                  <select value={formData.tipo_gasto} onChange={(e) => setFormData({...formData, tipo_gasto: e.target.value})} className="flex h-11 w-full rounded-field border border-ink-200 dark:border-ink-700 bg-transparent dark:bg-ink-800 px-3 py-1 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20">
                    <option value="Insumo">Insumo</option>
                    <option value="Fijo">Fijo</option>
                    <option value="Variable">Variable</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink-700 dark:text-ink-300">Fecha del Pago</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
                  <Input required type="date" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} className="pl-9 dark:bg-ink-800 dark:border-ink-700 dark:text-white" />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Registrar Gasto'}
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-ink-900 rounded-card border border-ink-200 dark:border-ink-800 shadow-card overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-ink-100 dark:border-ink-800 flex justify-between items-center">
              <h3 className="font-bold text-ink-800 dark:text-white">Historial de Registros</h3>
            </div>
            <div className="flex-1 overflow-auto max-h-[500px] scrollbar-thin">
              <table className="w-full text-left text-sm text-ink-600 dark:text-ink-300">
                <thead className="bg-ink-50 dark:bg-ink-950/50 text-ink-700 dark:text-ink-400 uppercase font-semibold sticky top-0 border-b border-ink-200 dark:border-ink-800">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {gastos.map((gasto) => (
                    <tr key={gasto.id} className="hover:bg-ink-50 dark:hover:bg-ink-800/50">
                      <td className="px-4 py-3 font-medium">{new Date(gasto.fecha).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-ink-900 dark:text-ink-100">{gasto.descripcion}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-400">
                          {gasto.tipo_gasto}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">${Number(gasto.monto).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleEliminarGasto(gasto.id)} className="h-8 w-8 text-ink-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}