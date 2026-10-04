// src/pages/PublicMenu.tsx
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, X, UtensilsCrossed, Sparkles, MapPin } from 'lucide-react';
import { useIsolateTheme } from '@/hooks/useIsolateTheme';
import { ContactIcon, buildContactUrl, type Contacto } from '@/components/icons/contact-icons';

interface RestauranteInfo {
  nombre: string;
  direccion: string | null;
  color_principal: string;
  color_fondo: string;
  color_tarjeta?: string;
  color_texto: 'auto' | 'oscuro' | 'claro';
  fondo_tipo: 'color' | 'imagen';
  fondo_imagen_url: string | null;
  mensaje_bienvenida: string;
  orden_categorias: string[];
  logo_url: string | null;
  mostrar_sugerencias: boolean;
  contactos: Contacto[];
}

interface ProductoInfo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  es_sugerencia: boolean;
}

/* ── Utilidades de contraste WCAG ─────────────────────── */
function getLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 0.5;
  const rgb = clean.match(/.{2}/g)?.map((c) => parseInt(c, 16) / 255) ?? [0, 0, 0];
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getTextColorFor(bg: string): string {
  return getLuminance(bg) > 0.5 ? '#1e293b' : '#f8fafc';
}

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
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

      // Migración transparente de contactos
      let loadedContacts: Contacto[] = [];
      if (Array.isArray(restData.contactos) && restData.contactos.length > 0) {
        loadedContacts = restData.contactos as Contacto[];
      } else {
        if (restData.whatsapp) {
          loadedContacts.push({
            id: 'legacy-w',
            tipo: 'whatsapp',
            valor: restData.whatsapp,
          });
        }
        if (restData.instagram) {
          loadedContacts.push({
            id: 'legacy-i',
            tipo: 'instagram',
            valor: restData.instagram,
          });
        }
      }

      setRestaurante({
        nombre: restData.nombre,
        direccion: restData.direccion || null,
        color_principal: restData.color_principal || '#4f46e5',
        color_fondo: restData.color_fondo || '#f8fafc',
        color_tarjeta: restData.color_tarjeta || '#ffffff',
        color_texto: (restData.color_texto as 'auto' | 'oscuro' | 'claro') || 'auto',
        fondo_tipo: (restData.fondo_tipo as 'color' | 'imagen') || 'color',
        fondo_imagen_url: restData.fondo_imagen_url || null,
        mensaje_bienvenida: restData.mensaje_bienvenida || '¡Bienvenidos!',
        orden_categorias: restData.orden_categorias || [],
        logo_url: restData.logo_url || null,
        mostrar_sugerencias: restData.mostrar_sugerencias ?? true,
        contactos: loadedContacts,
      });

      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select('*')
        .eq('restaurante_id', restData.id)
        .eq('status', 'Activo');

      if (prodError) throw prodError;

      if (prodData) {
        setProductos(
          prodData.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || null,
            price: p.price,
            category: p.category,
            image_url: p.image_url || null,
            es_sugerencia: p.es_sugerencia ?? false,
          }))
        );
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error cargando menú:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  /* ── Hooks que deben ir SIEMPRE antes de cualquier return ── */
  const cardBg = restaurante?.color_tarjeta || '#ffffff';

  // Color de texto final aplicado a las cards
  const textoColor = useMemo(() => {
    if (!restaurante) return '#1e293b';
    if (restaurante.color_texto === 'oscuro') return '#1e293b';
    if (restaurante.color_texto === 'claro') return '#f8fafc';
    // auto: calcular contraste contra el fondo de tarjeta
    return getTextColorFor(restaurante.color_tarjeta || '#ffffff');
  }, [restaurante]);

  // Estilo del header según fondo_tipo
  const headerStyle = useMemo<React.CSSProperties>(() => {
    if (!restaurante) return {};
    if (restaurante.fondo_tipo === 'imagen' && restaurante.fondo_imagen_url) {
      return {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("${restaurante.fondo_imagen_url}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return { backgroundColor: restaurante.color_principal };
  }, [restaurante]);

  /* ── Derivados (deben ejecutarse con restaurante válido) ── */
  const sugerencias = useMemo(() => {
    if (!restaurante || !restaurante.mostrar_sugerencias) return [];
    return productos.filter((p) => p.es_sugerencia);
  }, [productos, restaurante]);

  const sugerenciasIds = useMemo(() => new Set(sugerencias.map((s) => s.id)), [sugerencias]);

  const productosSinSugerencias = useMemo(
    () => productos.filter((p) => !sugerenciasIds.has(p.id)),
    [productos, sugerenciasIds]
  );

  const productosFiltrados = useMemo(
    () =>
      productosSinSugerencias.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [productosSinSugerencias, searchTerm]
  );

  const productosPorCategoria = useMemo(() => {
    return productosFiltrados.reduce((acc, producto) => {
      if (!acc[producto.category]) acc[producto.category] = [];
      acc[producto.category].push(producto);
      return acc;
    }, {} as Record<string, ProductoInfo[]>);
  }, [productosFiltrados]);

  const categoriasOrdenadas = useMemo(() => {
    const cats = Object.keys(productosPorCategoria);
    if (!restaurante) return cats;
    return cats.sort((a, b) => {
      const indexA = restaurante.orden_categorias.indexOf(a);
      const indexB = restaurante.orden_categorias.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [productosPorCategoria, restaurante]);

  const sugerenciasFiltradas = useMemo(() => {
    if (!searchTerm) return sugerencias;
    return sugerencias.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sugerencias, searchTerm]);

  const mostrarSeccionSugerencias = sugerenciasFiltradas.length > 0;
  const noHayResultados = sugerenciasFiltradas.length === 0 && categoriasOrdenadas.length === 0;

  /* ── Returns condicionales (después de TODOS los hooks) ── */
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

  return (
    <div
      className="public-menu-scope min-h-screen pb-16 font-sans transition-colors duration-500"
      style={{ backgroundColor: restaurante.color_fondo }}
    >
      {/* HEADER con imagen o color de fondo */}
      <header
        className="pt-8 pb-7 px-5 text-center text-white shadow-sm relative overflow-hidden transition-all duration-300"
        style={headerStyle}
      >
        {restaurante.fondo_tipo !== 'imagen' && (
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
        )}

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

          {/* Dirección */}
          {restaurante.direccion && (
            <p className="text-white/85 text-xs font-medium mt-1.5 flex items-center gap-1.5">
              <MapPin size={12} /> {restaurante.direccion}
            </p>
          )}

          {restaurante.mensaje_bienvenida && (
            <p className="text-white/90 text-xs sm:text-sm font-medium mt-1 leading-snug max-w-md">
              {restaurante.mensaje_bienvenida}
            </p>
          )}

          {/* Contactos dinámicos */}
          {restaurante.contactos.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {restaurante.contactos.map((c) => (
                <a
                  key={c.id}
                  href={buildContactUrl(c.tipo, c.valor)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-semibold transition"
                >
                  <ContactIcon tipo={c.tipo} size={12} />
                  {c.label || c.valor}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* BUSCADOR */}
      <div className="sticky top-2 z-30 max-w-3xl mx-auto px-4 mt-3">
        <div className="bg-white/85 backdrop-blur-md rounded-xl shadow-xs border border-slate-200/80 px-3 py-2 flex items-center gap-2 transition-all focus-within:shadow-md focus-within:border-slate-300">
          <Search className="text-slate-400 shrink-0" size={16} />
          <input
            type="text"
            inputMode="search"
            placeholder="Buscar plato o bebida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-0 bg-transparent text-sm py-0.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-7">
        {/* SUGERENCIAS */}
        {mostrarSeccionSugerencias && (
          <section
            aria-label="Sugerencias del chef"
            className="relative rounded-3xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ backgroundColor: restaurante.color_principal }}
          >
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 p-5 sm:p-6">
              <div className="flex items-center justify-center gap-3 mb-5">
                <span className="h-px flex-1 max-w-[60px] bg-white/30" />
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-white/90" />
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-[0.2em] text-white drop-shadow-sm">
                    Sugerencias del Chef
                  </h2>
                  <Sparkles size={16} className="text-white/90" />
                </div>
                <span className="h-px flex-1 max-w-[60px] bg-white/30" />
              </div>

              <p className="text-center text-white/80 text-xs mb-5 -mt-2">
                Platos recomendados por nuestra cocina
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sugerenciasFiltradas.map((prod) => (
                  <div
                    key={prod.id}
                    className="rounded-2xl p-3.5 shadow-md border border-white/10 flex gap-3 overflow-hidden transition-transform hover:scale-[1.01]"
                    style={{ backgroundColor: cardBg, color: textoColor }}
                  >
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm leading-snug">{prod.name}</h3>
                          {!prod.image_url && (
                            <span className="font-black text-sm shrink-0">
                              ${prod.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {prod.description && prod.description.trim() !== '' && (
                          <p className="text-xs opacity-70 line-clamp-2 mt-1 leading-relaxed">
                            {prod.description}
                          </p>
                        )}
                      </div>
                      {prod.image_url && (
                        <div className="mt-2">
                          <span className="font-black text-sm sm:text-base">
                            ${prod.price.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {prod.image_url && (
                      <div className="w-16 h-16 shrink-0 rounded-lg bg-slate-100 overflow-hidden self-center">
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
            </div>
          </section>
        )}

        {/* CATEGORÍAS */}
        {noHayResultados ? (
          <div className="text-center py-12 text-slate-400 text-sm bg-white/40 rounded-2xl border border-slate-200/40">
            {searchTerm
              ? `No se encontraron productos para "${searchTerm}".`
              : 'No hay productos disponibles en este momento.'}
          </div>
        ) : (
          categoriasOrdenadas.map((categoria) => (
            <section key={categoria} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <h2
                  className="text-base sm:text-lg font-black uppercase tracking-wider"
                  style={{ color: restaurante.color_principal }}
                >
                  {categoria}
                </h2>
                <div className="flex-1 h-px bg-slate-200/60"></div>
                <span className="text-[11px] font-bold text-slate-400">
                  {productosPorCategoria[categoria].length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {productosPorCategoria[categoria].map((prod) => (
                  <div
                    key={prod.id}
                    className="rounded-xl p-3 shadow-xs border border-black/5 flex gap-3 overflow-hidden transition-all hover:shadow-sm"
                    style={{ backgroundColor: cardBg, color: textoColor }}
                  >
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm leading-snug">{prod.name}</h3>
                          {!prod.image_url && (
                            <span className="font-black text-sm shrink-0">
                              ${prod.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {prod.description && prod.description.trim() !== '' && (
                          <p className="text-xs opacity-70 line-clamp-2 mt-1 leading-relaxed">
                            {prod.description}
                          </p>
                        )}
                      </div>
                      {prod.image_url && (
                        <div className="mt-2">
                          <span className="font-black text-sm sm:text-base">
                            ${prod.price.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {prod.image_url && (
                      <div className="w-20 h-20 shrink-0 rounded-lg bg-slate-100 overflow-hidden self-center">
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

      <footer className="text-center text-xs text-slate-400 mt-12 py-4">
        Carta digital potenciada por <span className="font-bold text-indigo-500">CocinApp</span>
      </footer>
    </div>
  );
}