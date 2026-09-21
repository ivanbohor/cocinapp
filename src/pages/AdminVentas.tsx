// src/pages/AdminVentas.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2, Receipt, Eye, Search, X, Calendar, CreditCard, Banknote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Definimos la estructura compleja de una Venta que incluye sus ítems
interface VentaItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Venta {
  id: string;
  created_at: string;
  mesa: string;
  status: string;
  metodo_pago: string;
  total: number;
  venta_items: VentaItem[]; // La relación con los productos vendidos
}

export default function AdminVentas() {
  const { restauranteId } = useAuthStore();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el modal de inspección de ticket
  const [selectedTicket, setSelectedTicket] = useState<Venta | null>(null);

  useEffect(() => {
    if (restauranteId) fetchVentas();
  }, [restauranteId]);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      // Magia Relacional: Traemos las ventas Y sus items en una sola consulta
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id, created_at, mesa, status, metodo_pago, total,
          venta_items ( id, name, quantity, price )
        `)
        .eq('restaurante_id', restauranteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setVentas(data as Venta[]);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtramos por mesa o método de pago
  const filteredVentas = ventas.filter(v => 
    (v.mesa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.metodo_pago || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <p>Cargando historial de operaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-300 relative">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Historial de Ventas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Audita y revisa el detalle de todos los tickets emitidos.</p>
        </div>
        <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 max-w-xs w-full">
          <Search size={18} className="text-slate-400 ml-2" />
          <Input
            placeholder="Buscar por mesa o pago..."
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-8 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA DE VENTAS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Mesa / Ref</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Receipt className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    No hay ventas registradas que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredVentas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {new Date(venta.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(venta.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      {venta.mesa || 'Caja Rápida'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        venta.status === 'Pagado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {venta.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      {venta.metodo_pago === 'Tarjeta' ? <CreditCard size={16} className="text-indigo-500"/> : <Banknote size={16} className="text-emerald-500"/>}
                      {venta.metodo_pago}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                      ${venta.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(venta)} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                        <Eye size={18} className="mr-2" /> Ver Ticket
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VISUALIZADOR DE TICKET */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            
            {/* Header del Ticket */}
            <div className="bg-slate-900 dark:bg-slate-950 p-5 text-white flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Detalle de Operación</p>
                <h3 className="text-xl font-black">{selectedTicket.mesa || 'Venta de Caja'}</h3>
                <p className="text-sm text-slate-300 mt-1">{new Date(selectedTicket.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Lista de Productos (El Escandallo) */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 max-h-64 overflow-y-auto">
              <ul className="space-y-3">
                {selectedTicket.venta_items.map(item => (
                  <li key={item.id} className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                    <div className="flex gap-3 items-center">
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-1 rounded text-xs">
                        {item.quantity}x
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                    </div>
                    <span className="text-slate-600 dark:text-slate-400">${(item.price * item.quantity).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Financiero */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex justify-between items-center mb-2 text-sm text-slate-500 dark:text-slate-400">
                <span>Método de Pago:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedTicket.metodo_pago}</span>
              </div>
              <div className="flex justify-between items-center mb-2 text-sm text-slate-500 dark:text-slate-400">
                <span>Estado:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedTicket.status}</span>
              </div>
              <div className="flex justify-between items-end pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">TOTAL PAGADO</span>
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  ${selectedTicket.total.toLocaleString()}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}