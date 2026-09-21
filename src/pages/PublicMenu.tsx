// src/pages/PublicMenu.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, UtensilsCrossed } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface RestauranteInfo {
  nombre: string;
  color_principal: string;
  color_fondo: string;
  mensaje_bienvenida: string;
  orden_categorias: string[];
  logo_url: string | null;
}

interface ProductoInfo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
}

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  
  const [restaurante, setRestaurante] = useState<RestauranteInfo | null>(null);
  const [productos, setProductos] = useState<ProductoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (slug) fetchMenu();
  }, [slug]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      
      const { data: restData, error: restError } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('slug', slug)
        .single();

      if (restError || !restData) {
        setError(true);
        return;
      }

      setRestaurante({
        nombre: restData.nombre,
        color_principal: restData.color_principal || '#4f46e5',
        color_fondo: restData.color_fondo || '#f8fafc',
        mensaje_bienvenida: restData.mensaje_bienvenida || '¡Bienvenidos!',
        orden_categorias: restData.orden_categorias || [],
        logo_url: restData.logo_url || null
      });

      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select('*')
        .eq('restaurante_id', restData.id)
        .eq('status', 'Activo');

      if (prodError) throw prodError;
      
      if (prodData) {
        const productosSeguros = prodData.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || null,
          price: p.price,
          category: p.category,
          image_url: p.image_url || null
        }));
        setProductos(productosSeguros);
      }

    } catch (err) {
      console.error('Error cargando menú:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-500" />
        <p>Preparando la carta...</p>
      </div>
    );
  }

  if (error || !restaurante) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <UtensilsCrossed className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Restaurante no encontrado</h2>
        <p className="text-slate-500">El menú que intentas buscar no existe o el enlace es incorrecto.</p>
      </div>
    );
  }

  const productosFiltrados = productos.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const productosPorCategoria = productosFiltrados.reduce((acc, producto) => {
    if (!acc[producto.category]) acc[producto.category] = [];
    acc[producto.category].push(producto);
    return acc;
  }, {} as Record<string, ProductoInfo[]>);

  const categoriasPresentes = Object.keys(productosPorCategoria);

  const categoriasOrdenadas = categoriasPresentes.sort((a, b) => {
    const indexA = restaurante.orden_categorias.indexOf(a);
    const indexB = restaurante.orden_categorias.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    // INYECCIÓN DE COLOR DE FONDO
    <div className="min-h-screen pb-12 font-sans transition-colors duration-500" style={{ backgroundColor: restaurante.color_fondo }}>
      
      {/* HEADER PERSONALIZADO */}
      <header 
        className="pt-10 pb-8 px-6 text-center text-white shadow-md relative overflow-hidden"
        style={{ backgroundColor: restaurante.color_principal }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10">
          {/* RENDERIZADO CONDICIONAL DEL LOGO */}
          {restaurante.logo_url && (
            <div className="mb-4 flex justify-center">
              <img 
                src={restaurante.logo_url} 
                alt={`Logo de ${restaurante.nombre}`} 
                className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg"
              />
            </div>
          )}
          <h1 className="text-3xl font-black mb-2 tracking-tight drop-shadow-md">{restaurante.nombre}</h1>
          <p className="text-white/95 font-medium text-sm max-w-md mx-auto drop-shadow-sm">{restaurante.mensaje_bienvenida}</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 -mt-5 relative z-20">
        <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-100 flex items-center">
          <Search className="text-slate-400 ml-2 mr-2" size={20} />
          <Input placeholder="Buscar en el menú..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-0 shadow-none focus-visible:ring-0 text-lg px-0" />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 mt-8 space-y-8">
        {categoriasOrdenadas.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white/50 rounded-xl">No se encontraron productos activos.</div>
        ) : (
          categoriasOrdenadas.map(categoria => (
            <section key={categoria} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 
                className="text-xl font-black mb-4 flex items-center gap-2 uppercase tracking-wide"
                style={{ color: restaurante.color_principal }}
              >
                {categoria}
              </h2>
              
              <div className="space-y-4">
                {productosPorCategoria[categoria].map(prod => (
                  <div key={prod.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100/50 flex gap-4 overflow-hidden transition-transform hover:scale-[1.01]">
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{prod.name}</h3>
                        {prod.description && prod.description.trim() !== '' && (
                          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">{prod.description}</p>
                        )}
                      </div>
                      <span className="font-black text-lg text-slate-900">${prod.price.toLocaleString()}</span>
                    </div>

                    {prod.image_url ? (
                      <div className="w-24 h-24 shrink-0 rounded-xl bg-slate-100 overflow-hidden">
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <UtensilsCrossed className="text-slate-300" size={24} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}