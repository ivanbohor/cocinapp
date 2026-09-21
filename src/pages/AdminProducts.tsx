// src/pages/AdminProducts.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search, Edit, Trash2, UtensilsCrossed, X, ArrowUp, ArrowDown, ListOrdered } from 'lucide-react';

interface Producto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  status: string;
  image_url: string | null;
}

export default function AdminProducts() {
  const { restauranteId } = useAuthStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ordenGuardado, setOrdenGuardado] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [categoriasActivas, setCategoriasActivas] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: 'Platos Principales', status: 'Activo', image_url: ''
  });

  useEffect(() => {
    if (restauranteId) fetchDatos();
  }, [restauranteId]);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      // Traer productos
      const { data: prodData, error: prodError } = await supabase.from('productos').select('*').eq('restaurante_id', restauranteId).order('category', { ascending: true });
      if (prodError) throw prodError;
      
      // Traer orden de categorías del restaurante
      const { data: restData } = await supabase.from('restaurantes').select('orden_categorias').eq('id', restauranteId).single();
      
      if (prodData) setProductos(prodData);
      if (restData && restData.orden_categorias) setOrdenGuardado(restData.orden_categorias);
    } catch (error) {
      console.error('Error:', error);
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
        image_url: formData.image_url.trim() || null
      };

      if (activeId) {
        const { error } = await supabase.from('productos').update(payload).eq('id', activeId);
        if (error) throw error;
        setProductos(productos.map(p => p.id === activeId ? { ...p, ...payload } : p));
      } else {
        const { data, error } = await supabase.from('productos').insert([payload]).select();
        if (error) throw error;
        if (data) setProductos([...productos, data[0]]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) throw error;
      setProductos(productos.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  // ===============================================
  // LÓGICA DE ORDENAMIENTO DE CATEGORÍAS
  // ===============================================
  const abrirModalOrden = () => {
    // 1. Extraemos las categorías únicas del catálogo actual
    const categoriasUnicas = Array.from(new Set(productos.map(p => p.category)));
    // 2. Las ordenamos usando el historial guardado
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
      await supabase.from('restaurantes').update({ orden_categorias: categoriasActivas }).eq('id', restauranteId);
      setOrdenGuardado(categoriasActivas);
      setIsOrderModalOpen(false);
    } catch (error) {
      console.error('Error guardando orden:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = productos.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex h-full items-center justify-center text-slate-500"><Loader2 className="animate-spin mr-3" />Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Menú y Productos</h2>
          <p className="text-slate-500 text-sm">Gestiona los platos de tu carta.</p>
        </div>
        <div className="flex gap-2">
           <Button 
                variant="outline" 
                onClick={abrirModalOrden} 
                // Añadimos dark:text-slate-100 y dark:hover:text-white para asegurar contraste
                className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:dark:bg-slate-700"
              >
                <ListOrdered size={18} className="mr-2" /> Organizar Carta
              </Button>
          
          <Button onClick={() => { setActiveId(null); setFormData({ name: '', description: '', price: '', category: 'Platos Principales', status: 'Activo', image_url: '' }); setIsModalOpen(true); }} className="bg-slate-900 dark:bg-indigo-600 text-white">
            <Plus size={18} className="mr-2" /> Nuevo
          </Button>
        </div>
      </div>

      <div className="flex items-center bg-white p-2 rounded-lg border shadow-sm max-w-md dark:bg-slate-900">
        <Search size={20} className="text-slate-400 mx-2" />
        <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-0 shadow-none dark:bg-slate-900 dark:text-white" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-700 border-b">
            <tr><th className="px-6 py-4">Producto</th><th className="px-6 py-4">Categoría</th><th className="px-6 py-4">Precio</th><th className="px-6 py-4 text-center">Estado</th><th className="px-6 py-4 text-right">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((prod) => (
              <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4"><p className="font-bold dark:text-white">{prod.name}</p>{prod.description && <p className="text-xs text-slate-400 truncate max-w-xs">{prod.description}</p>}</td>
                <td className="px-6 py-4">
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 px-2.5 py-1 rounded-md text-xs font-medium border border-transparent dark:border-slate-600">
                      {prod.category}
                    </span>
                  </td>
                <td className="px-6 py-4 font-black dark:text-white">${prod.price.toLocaleString()}</td>
                <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${prod.status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{prod.status}</span></td>
                <td className="px-6 py-4 text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => { setActiveId(prod.id); setFormData({ name: prod.name, description: prod.description || '', price: prod.price.toString(), category: prod.category, status: prod.status, image_url: prod.image_url || '' }); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-500"><Edit size={18} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(prod.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL ORDENAR CATEGORÍAS */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden border">
            <div className="flex justify-between items-center p-5 border-b bg-slate-50 dark:bg-slate-950/50">
              <h3 className="font-bold text-slate-800 dark:text-white">Organizar Carta</h3>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
              <p className="text-xs text-slate-500 mb-4">Usa las flechas para elegir el orden en el que tus clientes verán las categorías en la carta web.</p>
              {categoriasActivas.map((cat, index) => (
                <div key={cat} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{cat}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moverCategoria(index, 'arriba')} disabled={index === 0}><ArrowUp size={16} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moverCategoria(index, 'abajo')} disabled={index === categoriasActivas.length - 1}><ArrowDown size={16} /></Button>
                  </div>
                </div>
              ))}
              <Button onClick={guardarOrden} disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Orden'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR/EDITAR PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold dark:text-white">{activeId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1.5"><label className="text-sm font-medium dark:text-slate-300">Nombre</label><Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="dark:bg-slate-800 dark:text-white" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium dark:text-slate-300">Descripción (Opcional)</label><textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none resize-none dark:bg-slate-800 dark:text-white dark:border-slate-700" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium dark:text-slate-300">Precio ($)</label><Input required type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="dark:bg-slate-800 dark:text-white" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium dark:text-slate-300">Estado</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="flex h-10 w-full rounded-md border bg-transparent px-3 text-sm outline-none dark:bg-slate-800 dark:text-white dark:border-slate-700"><option value="Activo">Activo</option><option value="Pausado">Pausado</option></select></div>
              </div>
              <div className="space-y-1.5"><label className="text-sm font-medium dark:text-slate-300">Categoría</label><Input required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="dark:bg-slate-800 dark:text-white" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium dark:text-slate-300">URL Imagen (Opcional)</label><Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="dark:bg-slate-800 dark:text-white" /></div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 dark:bg-indigo-600 text-white mt-4">{isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Guardar'}</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}