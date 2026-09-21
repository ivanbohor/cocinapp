// src/pages/AdminStock.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search, Edit, Trash2, Bell, X, Package } from 'lucide-react';

interface Insumo {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad_medida: string;
  fecha_alarma: string | null;
}

export default function AdminStock() {
  const { restauranteId } = useAuthStore();
  
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para controlar si el usuario cerró la alerta flotante
  const [toastDismissed, setToastDismissed] = useState(false);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const [itemForm, setItemForm] = useState({
    nombre: '',
    categoria: 'Almacén',
    cantidad: '',
    unidad_medida: 'Unidades'
  });

  const [alarmDate, setAlarmDate] = useState('');

  // Calcula la fecha local exacta para el input datetime-local
  const calcularTiempo = (minutosAAgregar: number) => {
    const fecha = new Date();
    fecha.setMinutes(fecha.getMinutes() + minutosAAgregar);
    // Truco para formatear a formato YYYY-MM-DDThh:mm en zona horaria local
    const offset = fecha.getTimezoneOffset() * 60000;
    return new Date(fecha.getTime() - offset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (restauranteId) {
      fetchInsumos();
      
      // Magia UX: Refrescamos la pantalla cada minuto para que las alarmas cambien a ROJO automáticamente
      const interval = setInterval(() => {
        setInsumos(prev => [...prev]); 
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [restauranteId]);

  const fetchInsumos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .order('categoria', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) throw error;
      if (data) setInsumos(data);
    } catch (error) {
      console.error('Error al cargar stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        restaurante_id: restauranteId,
        nombre: itemForm.nombre.trim(),
        categoria: itemForm.categoria,
        cantidad: parseFloat(itemForm.cantidad),
        unidad_medida: itemForm.unidad_medida
      };

      if (activeItemId) {
        const { error } = await supabase.from('insumos').update(payload).eq('id', activeItemId);
        if (error) throw error;
        setInsumos(insumos.map(i => i.id === activeItemId ? { ...i, ...payload } : i));
      } else {
        const { data, error } = await supabase.from('insumos').insert([payload]).select();
        if (error) throw error;
        if (data) setInsumos([...insumos, data[0]]);
      }
      closeItemModal();
    } catch (error) {
      console.error('Error al guardar insumo:', error);
      alert('Hubo un error al guardar los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('¿Eliminar este insumo del inventario?')) return;
    try {
      const { error } = await supabase.from('insumos').delete().eq('id', id);
      if (error) throw error;
      setInsumos(insumos.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const handleSaveAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItemId) return;
    setIsSubmitting(true);

    try {
      // Guardamos la fecha en formato ISO estándar para la base de datos
      const isoDate = alarmDate ? new Date(alarmDate).toISOString() : null;

      const { error } = await supabase
        .from('insumos')
        .update({ fecha_alarma: isoDate })
        .eq('id', activeItemId);
        
      if (error) throw error;
      
      setInsumos(insumos.map(i => i.id === activeItemId ? { ...i, fecha_alarma: isoDate } : i));
      
      // Reiniciamos el toast dismiss si programamos una nueva alarma para permitir que nos avise
      setToastDismissed(false); 
      closeAlertModal();
    } catch (error) {
      console.error('Error al guardar alarma:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAlarm = async () => {
    if (!activeItemId) return;
    try {
      await supabase.from('insumos').update({ fecha_alarma: null }).eq('id', activeItemId);
      setInsumos(insumos.map(i => i.id === activeItemId ? { ...i, fecha_alarma: null } : i));
      closeAlertModal();
    } catch (error) {
      console.error('Error al limpiar alarma:', error);
    }
  };

  const openItemModal = (insumo?: Insumo) => {
    if (insumo) {
      setActiveItemId(insumo.id);
      setItemForm({
        nombre: insumo.nombre,
        categoria: insumo.categoria,
        cantidad: insumo.cantidad.toString(),
        unidad_medida: insumo.unidad_medida
      });
    } else {
      setActiveItemId(null);
      setItemForm({ nombre: '', categoria: 'Almacén', cantidad: '', unidad_medida: 'Unidades' });
    }
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setActiveItemId(null);
  };

  const openAlertModal = (insumo: Insumo) => {
    setActiveItemId(insumo.id);
    if (insumo.fecha_alarma) {
      // Convertimos el UTC de la base de datos al formato local YYYY-MM-DDThh:mm
      const d = new Date(insumo.fecha_alarma);
      const offset = d.getTimezoneOffset() * 60000;
      setAlarmDate(new Date(d.getTime() - offset).toISOString().slice(0, 16));
    } else {
      setAlarmDate(calcularTiempo(24 * 60)); // Sugerimos mañana (24 horas)
    }
    setIsAlertModalOpen(true);
  };

  const closeAlertModal = () => {
    setIsAlertModalOpen(false);
    setActiveItemId(null);
  };

  // Verificamos si la fecha y hora EXACTA ya pasaron
  const esUrgente = (fechaAviso: string | null) => {
    if (!fechaAviso) return false;
    const ahora = new Date();
    const aviso = new Date(fechaAviso);
    return aviso <= ahora; // Compara milisegundos exactos
  };

  const filteredInsumos = insumos.filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  const insumosUrgentes = insumos.filter(i => esUrgente(i.fecha_alarma)).length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative transition-colors duration-300">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Stock y Alertas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona tu inventario físico y programa avisos de reposición.</p>
        </div>
        <Button onClick={() => openItemModal()} className="bg-slate-900 dark:bg-indigo-600 text-white w-full sm:w-auto">
          <Plus size={18} className="mr-2" /> Agregar Insumo
        </Button>
      </div>

      {/* BUSCADOR */}
      <div className="flex items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm max-w-md">
        <Search size={20} className="text-slate-400 ml-2 mr-2" />
        <Input
          placeholder="Buscar insumo..."
          className="border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLA DE INSUMOS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Insumo</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Cantidad</th>
                <th className="px-6 py-4 text-center">Alarma</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInsumos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Package className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    No hay insumos registrados en el inventario.
                  </td>
                </tr>
              ) : (
                filteredInsumos.map((insumo) => {
                  const alarmaUrgente = esUrgente(insumo.fecha_alarma);
                  const tieneAlarma = !!insumo.fecha_alarma;

                  return (
                    <tr key={insumo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{insumo.nombre}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium">
                          {insumo.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-700 dark:text-slate-200">
                        {insumo.cantidad} <span className="text-xs font-normal text-slate-400">{insumo.unidad_medida}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openAlertModal(insumo)}
                          className={`rounded-full px-3 ${
                            alarmaUrgente ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400' :
                            tieneAlarma ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400' :
                            'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          }`}
                        >
                          <Bell size={16} className={alarmaUrgente ? "animate-pulse" : ""} />
                          {alarmaUrgente && <span className="ml-2 font-bold text-xs uppercase">¡Urgente!</span>}
                        </Button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openItemModal(insumo)} className="text-slate-400 hover:text-indigo-500">
                          <Edit size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(insumo.id)} className="text-slate-400 hover:text-red-500">
                          <Trash2 size={18} />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INSUMO (CREAR / EDITAR) */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {activeItemId ? 'Editar Insumo' : 'Agregar Nuevo Insumo'}
              </h3>
              <button onClick={closeItemModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveItem} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium dark:text-slate-300">Nombre del Insumo</label>
                <Input required value={itemForm.nombre} onChange={(e) => setItemForm({...itemForm, nombre: e.target.value})} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium dark:text-slate-300">Categoría</label>
                <select value={itemForm.categoria} onChange={(e) => setItemForm({...itemForm, categoria: e.target.value})} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white px-3 py-1 text-sm outline-none">
                  <option value="Almacén">Almacén / Secos</option>
                  <option value="Carnes">Carnes / Proteínas</option>
                  <option value="Verdulería">Verdulería</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Limpieza">Limpieza / Papelería</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium dark:text-slate-300">Cantidad Actual</label>
                  <Input required type="number" min="0" step="0.01" value={itemForm.cantidad} onChange={(e) => setItemForm({...itemForm, cantidad: e.target.value})} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium dark:text-slate-300">Unidad</label>
                  <select value={itemForm.unidad_medida} onChange={(e) => setItemForm({...itemForm, unidad_medida: e.target.value})} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white px-3 py-1 text-sm outline-none">
                    <option value="Kg">Kilogramos (Kg)</option>
                    <option value="Gramos">Gramos (g)</option>
                    <option value="Litros">Litros (L)</option>
                    <option value="Unidades">Unidades (U)</option>
                    <option value="Cajas">Cajas</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 dark:bg-indigo-600 text-white mt-4">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Insumo'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ALARMA */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-amber-500" /> Horario de Alerta
              </h3>
              <button onClick={closeAlertModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveAlarm} className="p-5 space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Selecciona el día y la hora exacta del aviso.</p>
              
              <div className="grid grid-cols-4 gap-2 mb-2">
                <Button type="button" variant="outline" size="sm" className="text-xs px-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" onClick={() => setAlarmDate(calcularTiempo(1))}>1 Min</Button>
                <Button type="button" variant="outline" size="sm" className="text-xs px-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" onClick={() => setAlarmDate(calcularTiempo(60))}>1 Hora</Button>
                <Button type="button" variant="outline" size="sm" className="text-xs px-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" onClick={() => setAlarmDate(calcularTiempo(24 * 60))}>Mañana</Button>
                <Button type="button" variant="outline" size="sm" className="text-xs px-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" onClick={() => setAlarmDate(calcularTiempo(3 * 24 * 60))}>3 Días</Button>
              </div>
              
              <div className="relative mb-6">
                <Input required type="datetime-local" value={alarmDate} onChange={(e) => setAlarmDate(e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm" />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={clearAlarm} className="w-1/2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                  Quitar Alarma
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-1/2 bg-slate-900 dark:bg-indigo-600 text-white">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Activar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOAST DE NOTIFICACIÓN FLOTANTE */}
      {insumosUrgentes > 0 && !toastDismissed && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-8 flex items-start gap-4 max-w-sm border border-red-500">
          <Bell className="h-6 w-6 shrink-0 animate-bounce" />
          <div className="flex-1">
            <h4 className="font-bold text-lg leading-tight mb-1">¡Alarma de Stock!</h4>
            <p className="text-red-100 text-sm">
              Tienes {insumosUrgentes} insumo(s) que requieren reposición urgente. Revisa la tabla.
            </p>
          </div>
          <button 
            onClick={() => setToastDismissed(true)} 
            className="text-red-200 hover:text-white hover:bg-red-700 p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

    </div>
  );
}