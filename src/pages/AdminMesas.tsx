// src/pages/AdminMesas.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePosStore } from '@/stores/usePosStore';
import { Loader2, Coffee, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

interface VentaItem {
  id: string;
  producto_id: string;
  name: string;
  quantity: number;
  price: number;
}

interface MesaAbierta {
  id: string;
  mesa: string;
  total: number;
  created_at: string;
  venta_items: VentaItem[];
}

export default function AdminMesas() {
  const { restauranteId } = useAuthStore();
  const { setOrderFromTable } = usePosStore();
  const navigate = useNavigate();

  const [mesas, setMesas] = useState<MesaAbierta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restauranteId) fetchMesasAbiertas();
  }, [restauranteId]);

  const fetchMesasAbiertas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id, mesa, total, created_at,
          venta_items ( id, producto_id, name, quantity, price )
        `)
        .eq('status', 'Abierto')
        .eq('restaurante_id', restauranteId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMesas(data as MesaAbierta[]);
    } catch (error) {
      console.error('Error al cargar mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para transferir la mesa al POS
  const handleLoadTable = (mesa: MesaAbierta) => {
    const formattedItems = mesa.venta_items.map(item => ({
      id: item.id,
      productId: item.producto_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    setOrderFromTable(mesa.id, mesa.mesa, formattedItems);
    navigate('/pos');
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mr-3 text-slate-900 dark:text-white" />
        <p>Cargando el salón...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Mesas</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Visualiza y administra las cuentas que están actualmente abiertas.</p>
      </div>

      {mesas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <Coffee className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Salón Vacío</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">No hay cuentas abiertas en este momento.</p>
          <Link to="/pos">
            <Button className="bg-slate-900 dark:bg-indigo-600 text-white">Ir a la Caja (POS)</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mesas.map((mesa) => (
            <div key={mesa.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
              <div className="bg-slate-900 dark:bg-slate-950 p-4 flex justify-between items-center text-white border-b border-slate-800">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Coffee size={18} className="text-indigo-400" /> 
                  {mesa.mesa || 'Mesa sin nombre'}
                </h3>
                <span className="text-xs font-medium bg-slate-800 px-2 py-1 rounded flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(mesa.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>

              <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto max-h-48 space-y-2">
                {mesa.venta_items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                    <span><span className="font-bold text-slate-900 dark:text-white mr-1">{item.quantity}x</span> {item.name}</span>
                    <span className="font-medium">${(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Total Acumulado</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">${mesa.total.toLocaleString()}</p>
                </div>
                <Button onClick={() => handleLoadTable(mesa)} variant="outline" className="dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700">
                  Cargar <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}