// src/pages/PublicMenu.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, X, UtensilsCrossed } from 'lucide-react';
import { useIsolateTheme } from '@/hooks/useIsolateTheme';

interface RestauranteInfo {
  nombre: string;
  color_principal: string;
  color_fondo: string;
  color_tarjeta?: string;
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

  // 🔒 Aísla el tema del admin. La carta pública usa solo la paleta del restaurante.
  useIsolateTheme();

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
        color_tarjeta: restData.color_tarjeta || '#ffffff',
        mensaje_bienvenida: restData.mensaje_bienvenida || '¡Bienvenidos!',
        orden_categorias: restData.orden_categorias || [],
        logo_url: restData.logo_url || null,
      });

      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select('*')
        .eq('restaurante_id', restData.id)
        .eq('status', 'Activo');

      if (prodError) throw prodError;

      if (prodData) {
        const productosSeguros = prodData.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || null,
          price: p.price,
          category: p.category,
          image_url: p.image_url || null,
        }));
        setProductos(productosSeguros);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error cargando menú:', err);
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-500" />
        <p className="font-medium text-sm">Preparando la carta...</p>
      </div>
    );
  }

  if (error || !restaurante) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <UtensilsCrossed className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Restaurante no encontrado</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          El menú que intentas buscar no existe o el enlace es incorrecto.
        </p>
      </div>
    );
  }

  const productosFiltrados = productos.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  const cardBg = restaurante.color_tarjeta || '#ffffff';

  return (
    <div
      className="public-menu-scope min-h-screen pb-16 font-sans transition-colors duration-500"
      style={{ backgroundColor: restaurante.color_fondo }}
    >
      {/* HEADER PERSONALIZADO DE LA CARTA */}
      <header
        className="pt-8 pb-7 px-5 text-center text-white shadow-sm relative overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: restaurante.color_principal }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          {restaurante.logo_url && (
            <div className="mb-3 w-20 h-20 rounded-full border-3 border-white/90 shadow-md overflow-hidden bg-white">
              <img
                src={restaurante.logo_url}
                alt={`Logo de ${restaurante.nombre}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight drop-shadow-sm">
            {restaurante.nombre}
          </h1>

          {restaurante.mensaje_bienvenida && (
            <p className="text-white/90 text-xs sm:text-sm font-medium mt-1 leading-snug max-w-md">
              {restaurante.mensaje_bienvenida}
            </p>
          )}
        </div>
      </header>

      {/* BUSCADOR MINIMALISTA Y STICKY */}
      <div className="sticky top-2 z-30 max-w-3xl mx-auto px-4 mt-3">
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800/80 px-3 py-2 flex items-center gap-2 transition-all focus-within:shadow-md focus-within:border-slate-300">
          <Search className="text-slate-400 shrink-0" size={16} />
          <input
            type="text"
            inputMode="search"
            placeholder="Buscar plato o bebida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-0 bg-transparent text-sm py-0.5 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full transition"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* LISTADO DE CATEGORÍAS Y PRODUCTOS EN GRID RESPONSIVE */}
      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-7">
        {categoriasOrdenadas.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/40">
            {searchTerm
              ? `No se encontraron productos para "${searchTerm}".`
              : 'No hay productos disponibles en este momento.'}
          </div>
        ) : (
          categoriasOrdenadas.map((categoria) => (
            <section key={categoria} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* TÍTULO DE CATEGORÍA */}
              <div className="flex items-center gap-2 mb-3">
                <h2
                  className="text-base sm:text-lg font-black uppercase tracking-wider"
                  style={{ color: restaurante.color_principal }}
                >
                  {categoria}
                </h2>
                <div className="flex-1 h-px bg-slate-200/60 dark:bg-slate-800/60"></div>
                <span className="text-[11px] font-bold text-slate-400">
                  {productosPorCategoria[categoria].length}
                </span>
              </div>

              {/* GRID RESPONSIVE DE PLATOS: 1 COLUMNA EN MOBILE, 2 COLUMNAS EN TABLET / ESCRITORIO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {productosPorCategoria[categoria].map((prod) => (
                  <div
                    key={prod.id}
                    className="rounded-xl p-3 shadow-xs border border-black/5 dark:border-white/10 flex gap-3 overflow-hidden transition-all hover:shadow-sm"
                    style={{ backgroundColor: cardBg }}
                  >
                    {/* CONTENIDO DEL PLATO */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                            {prod.name}
                          </h3>
                          {/* Si el plato no tiene foto, el precio se destaca arriba a la derecha */}
                          {!prod.image_url && (
                            <span className="font-black text-sm text-slate-900 dark:text-white shrink-0">
                              ${prod.price.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {prod.description && prod.description.trim() !== '' && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {prod.description}
                          </p>
                        )}
                      </div>

                      {/* Si tiene foto, el precio va abajo */}
                      {prod.image_url && (
                        <div className="mt-2">
                          <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                            ${prod.price.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* FOTO COMPACTA (SI EXISTE) */}
                    {prod.image_url && (
                      <div className="w-20 h-20 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden self-center border border-slate-100 dark:border-slate-800">
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="text-center text-xs text-slate-400 mt-12 py-4">
        Carta digital potenciada por <span className="font-bold text-indigo-500">CocinApp</span>
      </footer>
    </div>
  );
}