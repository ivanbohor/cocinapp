// src/pages/PublicMenu.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  Loader2,
  Search,
  X,
  UtensilsCrossed,
  Sparkles,
  MapPin,
  ChefHat,
  ArrowUpRight,
  Plus,
  Minus,
  ShoppingBag,
  Trash2,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useIsolateTheme } from '@/hooks/useIsolateTheme';
import { resolveMenuDeliveryMode } from '@/utils/menuContext';
import {
  ContactIcon,
  buildContactUrl,
  CONTACT_LABELS,
  CONTACT_BADGE_BG,
  type Contacto,
} from '@/components/icons/contact-icons';

import { FormattedWelcomeText } from '@/components/ui/formatted-welcome-text';

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

interface CartItem {
  lineId: string;
  product: ProductoInfo;
  quantity: number;
  note: string;
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
  return getLuminance(bg) > 0.5 ? '#0f172a' : '#f8fafc';
}

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  useIsolateTheme();

  // Resuelve si el acceso es remoto (Delivery) o presencial (QR Salón)
  const [isDeliveryMode] = useState<boolean>(() => resolveMenuDeliveryMode());

  const [restaurante, setRestaurante] = useState<RestauranteInfo | null>(null);
  const [productos, setProductos] = useState<ProductoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Estados de detalle de plato y carrito de pedido
  const [selectedProduct, setSelectedProduct] = useState<ProductoInfo | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalNote, setModalNote] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerAddress, setCustomerAddress] = useState('');

  // Estados de retroalimentación visual inmediata ("¡Agregado!" y pulso en "Mi pedido")
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [cartHighlight, setCartHighlight] = useState(false);
  const [lastAddedName, setLastAddedName] = useState<string | null>(null);

  const buttonTimerRef = useRef<number | null>(null);
  const barTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (slug) fetchMenu();
  }, [slug]);

  useEffect(() => {
    return () => {
      if (buttonTimerRef.current) window.clearTimeout(buttonTimerRef.current);
      if (barTimerRef.current) window.clearTimeout(barTimerRef.current);
    };
  }, []);

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

  /* ── Derivados de color y contraste ───────────────────── */
  const cardBg = restaurante?.color_tarjeta || '#ffffff';
  const isDarkBg = useMemo(
    () => (restaurante ? getLuminance(restaurante.color_fondo) <= 0.5 : false),
    [restaurante]
  );
  const isDarkCard = useMemo(() => getLuminance(cardBg) <= 0.5, [cardBg]);

  const textoColor = useMemo(() => {
    if (!restaurante) return '#0f172a';
    if (restaurante.color_texto === 'oscuro') return '#0f172a';
    if (restaurante.color_texto === 'claro') return '#f8fafc';
    return getTextColorFor(cardBg);
  }, [restaurante, cardBg]);

  const headerStyle = useMemo<React.CSSProperties>(() => {
    if (!restaurante) return {};
    if (restaurante.fondo_tipo === 'imagen' && restaurante.fondo_imagen_url) {
      return {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.72)), url("${restaurante.fondo_imagen_url}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      background: `linear-gradient(160deg, ${restaurante.color_principal} 0%, color-mix(in srgb, ${restaurante.color_principal} 78%, #000000) 100%)`,
    };
  }, [restaurante]);

  /* ── Filtrado y agrupamiento de platos ────────────────── */
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

  const whatsappContact = useMemo(
    () => restaurante?.contactos.find((c) => c.tipo === 'whatsapp') || null,
    [restaurante]
  );

  /* ── Lógica del Carrito de Pedido (Modo Delivery) ─────── */
  const totalCartItems = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const totalCartAmount = useMemo(
    () => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [cart]
  );

  const openDishModal = (prod: ProductoInfo) => {
    setSelectedProduct(prod);
    setModalQuantity(1);
    setModalNote('');
  };

  const triggerAddedFeedback = (prod: ProductoInfo) => {
    setJustAddedId(prod.id);
    setLastAddedName(prod.name);
    setCartHighlight(true);

    if (buttonTimerRef.current) window.clearTimeout(buttonTimerRef.current);
    if (barTimerRef.current) window.clearTimeout(barTimerRef.current);

    buttonTimerRef.current = window.setTimeout(() => {
      setJustAddedId(null);
    }, 1500);

    barTimerRef.current = window.setTimeout(() => {
      setCartHighlight(false);
    }, 1400);
  };

  const addToCart = (prod: ProductoInfo, quantity = 1, note = '') => {
    const cleanNote = note.trim();
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === prod.id &&
          item.note.trim().toLowerCase() === cleanNote.toLowerCase()
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [
        ...prev,
        {
          lineId: `${prod.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          product: prod,
          quantity,
          note: cleanNote,
        },
      ];
    });

    triggerAddedFeedback(prod);
  };

  const updateCartItemQuantity = (lineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.lineId === lineId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const updateCartItemNote = (lineId: string, newNote: string) => {
    setCart((prev) =>
      prev.map((item) => (item.lineId === lineId ? { ...item, note: newNote } : item))
    );
  };

  const removeCartItem = (lineId: string) => {
    setCart((prev) => prev.filter((item) => item.lineId !== lineId));
  };

  const buildFullWhatsappOrderUrl = () => {
    if (!whatsappContact || !restaurante || cart.length === 0) return '#';

    const lines = cart.map((item) => {
      const subtotal = (item.product.price * item.quantity).toLocaleString();
      const baseLine = `• ${item.quantity}x *${item.product.name}* ($${subtotal})`;
      return item.note.trim() ? `${baseLine}\n   _Nota: ${item.note.trim()}_` : baseLine;
    });

    const addressBlock = customerAddress.trim()
      ? `\n\n📍 *Entrega / Modalidad:* ${customerAddress.trim()}`
      : '';

    const fullMessage =
      `Hola *${restaurante.nombre}*! Quisiera realizar el siguiente pedido:\n\n` +
      lines.join('\n') +
      `\n\n*Total estimado: $${totalCartAmount.toLocaleString()}*` +
      addressBlock;

    const baseUrl = buildContactUrl('whatsapp', whatsappContact.valor);
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}text=${encodeURIComponent(fullMessage)}`;
  };

  const scrollToSection = (sectionId: string, catName: string) => {
    setActiveCategory(catName);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const mostrarSeccionSugerencias = sugerenciasFiltradas.length > 0;
  const noHayResultados = sugerenciasFiltradas.length === 0 && categoriasOrdenadas.length === 0;
  const showDeliveryActions = isDeliveryMode && Boolean(whatsappContact);

  /* ── Estados de carga y error ─────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="h-9 w-9 animate-spin mb-3 text-slate-700" />
        <p className="font-medium text-sm tracking-tight">Preparando la carta...</p>
      </div>
    );
  }

  if (error || !restaurante) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <UtensilsCrossed className="h-14 w-14 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-1.5">Restaurante no encontrado</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          El menú que intentás buscar no existe o el enlace es incorrecto.
        </p>
      </div>
    );
  }

  /* ── Subcomponente visual de tarjeta de producto ──────── */
  const renderDishCard = (prod: ProductoInfo, isFeatured = false) => {
    const hasImage = Boolean(prod.image_url);
    const qtyInCart = cart
      .filter((item) => item.product.id === prod.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    const isJustAdded = justAddedId === prod.id;

    return (
      <article
        key={prod.id}
        onClick={() => openDishModal(prod)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openDishModal(prod);
          }
        }}
        className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer flex gap-3.5 overflow-hidden border
          ${
            isJustAdded
              ? 'ring-2 ring-emerald-500 border-emerald-500/60'
              : isDarkCard
              ? 'border-white/10 hover:border-white/25 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]'
              : 'border-black/[0.07] hover:border-black/20 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_25px_-6px_rgba(0,0,0,0.12)]'
          }
          hover:-translate-y-0.5 active:scale-[0.99]`}
        style={{ backgroundColor: cardBg, color: textoColor }}
      >
        {/* Sutil acento lateral en platos recomendados */}
        {isFeatured && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full opacity-80"
            style={{ backgroundColor: restaurante.color_principal }}
          />
        )}

        {/* Columna de contenido textual */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-[15px] sm:text-base leading-snug tracking-tight group-hover:underline decoration-current/30 underline-offset-4">
                {prod.name}
              </h3>

              {/* Layout sin imagen: insignia de precio alineada a la derecha */}
              {!hasImage && (
                <span
                  className={`shrink-0 px-2.5 py-1 rounded-xl font-extrabold text-sm tabular-nums tracking-tight ${
                    isDarkCard ? 'bg-white/12 text-white' : 'bg-black/[0.06] text-current'
                  }`}
                >
                  ${prod.price.toLocaleString()}
                </span>
              )}
            </div>

            {prod.description && prod.description.trim() !== '' && (
              <p className="text-xs opacity-80 line-clamp-2 mt-1.5 leading-relaxed">
                {prod.description}
              </p>
            )}
          </div>

          {/* Pie de tarjeta: precio + acción intuitiva según contexto */}
          <div className={`flex items-center justify-between gap-2 ${hasImage ? 'mt-3' : 'mt-3'}`}>
            {hasImage ? (
              <span
                className={`px-2.5 py-1 rounded-xl font-extrabold text-sm tabular-nums tracking-tight ${
                  isDarkCard ? 'bg-white/12 text-white' : 'bg-black/[0.06] text-current'
                }`}
              >
                ${prod.price.toLocaleString()}
              </span>
            ) : (
              <span className="text-xs font-medium opacity-70 underline decoration-dotted underline-offset-4 group-hover:opacity-100 transition-opacity">
                {showDeliveryActions ? '' : 'Ver detalle'}
              </span>
            )}

            {showDeliveryActions ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(prod, 1, '');
                }}
                aria-label={`Pedir ${prod.name}`}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all duration-200 active:scale-95 ${
                  isJustAdded
                    ? 'bg-emerald-600 scale-105 ring-2 ring-emerald-300/70'
                    : 'hover:brightness-110'
                }`}
                style={!isJustAdded ? { backgroundColor: restaurante.color_principal } : undefined}
              >
                {isJustAdded ? (
                  <>
                    <Check size={15} strokeWidth={3} />
                    <span>¡Agregado!</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} strokeWidth={2.75} />
                    <span>{qtyInCart > 0 ? `Pedir (${qtyInCart})` : 'Pedir'}</span>
                  </>
                )}
              </button>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold opacity-60 group-hover:opacity-100 transition-opacity">
                {hasImage && 'Ver'}
                <ArrowUpRight size={14} />
              </span>
            )}
          </div>
        </div>

        {/* Miniatura fotográfica (si existe) */}
        {hasImage && prod.image_url && (
          <div className="w-24 h-24 shrink-0 rounded-xl bg-black/5 overflow-hidden self-center ring-1 ring-black/10">
            <img
              src={prod.image_url}
              alt={prod.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}
      </article>
    );
  };

  return (
    <div
      className={`public-menu-scope min-h-screen font-sans transition-colors duration-500 ${
        showDeliveryActions && cart.length > 0 ? 'pb-32' : 'pb-16'
      }`}
      style={{ backgroundColor: restaurante.color_fondo }}
    >
      {/* CABECERA EDITORIAL */}
      <header
        className="pt-9 pb-10 px-5 text-center text-white relative overflow-hidden"
        style={headerStyle}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          {restaurante.logo_url && (
            <div className="mb-3.5 w-20 h-20 rounded-full ring-4 ring-white/25 shadow-xl overflow-hidden bg-white">
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

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            {restaurante.nombre}
          </h1>

          {restaurante.direccion && (
            <p className="text-white/80 text-xs font-medium mt-1.5 inline-flex items-center gap-1.5">
              <MapPin size={12} className="shrink-0" />
              <span>{restaurante.direccion}</span>
            </p>
          )}

          {restaurante.mensaje_bienvenida && (
            <div className="mt-3 mx-auto max-w-md rounded-2xl border border-white/20 bg-black/15 px-4 py-2 backdrop-blur-2xs">
              <FormattedWelcomeText
                text={restaurante.mensaje_bienvenida}
                className="text-xs sm:text-sm text-white/95 font-medium leading-relaxed space-y-1"
              />
            </div>
          )}

          
          
          {/* ICONOS OFICIALES COMPACTOS */}
          {restaurante.contactos.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              {restaurante.contactos.map((c) => {
                const tooltip = c.label?.trim() || CONTACT_LABELS[c.tipo] || 'Contacto';
                const badgeBackground = CONTACT_BADGE_BG[c.tipo] || '#334155';

                return (
                  <a
                    key={c.id}
                    href={buildContactUrl(c.tipo, c.valor)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={tooltip}
                    aria-label={tooltip}
                    style={{ background: badgeBackground }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full
                               text-white shadow-md ring-2 ring-white/30
                               transition-transform duration-200
                               hover:scale-110 active:scale-95
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <ContactIcon tipo={c.tipo} size={20} />
                  </a>
                );
              })}
            </div>
          )}
      
        </div>
      </header>

      {/* BARRA STICKY: BUSCADOR + NAVEGACIÓN RÁPIDA DE CATEGORÍAS */}
      <div className="sticky top-0 z-30 -mt-5 px-4 pt-2 pb-2.5 backdrop-blur-md bg-transparent">
        <div className="max-w-3xl mx-auto space-y-2">
          <div
            className={`rounded-2xl shadow-md border px-3.5 py-2.5 flex items-center gap-2.5 transition-all ${
              isDarkBg
                ? 'bg-slate-900/90 border-white/15 text-white'
                : 'bg-white/95 border-slate-200/90 text-slate-800'
            }`}
          >
            <Search className="text-slate-400 shrink-0" size={16} />
            <input
              type="text"
              inputMode="search"
              placeholder="Buscar plato, ingrediente o bebida..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-0 bg-transparent text-sm py-0.5 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition"
                aria-label="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {(mostrarSeccionSugerencias || categoriasOrdenadas.length > 1) && (
            <nav
              aria-label="Categorías del menú"
              className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {mostrarSeccionSugerencias && (
                <button
                  type="button"
                  onClick={() => scrollToSection('sec-sugerencias', 'Sugerencias')}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-xs transition-transform active:scale-95"
                  style={{ backgroundColor: restaurante.color_principal }}
                >
                  <Sparkles size={11} />
                  Sugerencias
                </button>
              )}
              {categoriasOrdenadas.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => scrollToSection(`cat-${encodeURIComponent(cat)}`, cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                      isActive
                        ? 'text-white border-transparent shadow-xs'
                        : isDarkBg
                        ? 'bg-slate-900/85 text-slate-200 border-white/15 hover:bg-slate-800'
                        : 'bg-white/90 text-slate-700 border-slate-200/80 hover:bg-white'
                    }`}
                    style={isActive ? { backgroundColor: restaurante.color_principal } : undefined}
                  >
                    {cat}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL DEL MENÚ */}
      <main className="max-w-3xl mx-auto px-4 mt-4 space-y-9">
        {mostrarSeccionSugerencias && (
          <section
            id="sec-sugerencias"
            aria-label="Sugerencias del chef"
            className="scroll-mt-32 relative rounded-3xl p-5 sm:p-6 overflow-hidden border shadow-md"
            style={{
              backgroundColor: `color-mix(in srgb, ${restaurante.color_principal} 14%, ${restaurante.color_fondo})`,
              borderColor: `color-mix(in srgb, ${restaurante.color_principal} 35%, transparent)`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-xs"
                  style={{ backgroundColor: restaurante.color_principal }}
                >
                  <Sparkles size={14} />
                </span>
                <div>
                  <h2
                    className="text-sm sm:text-base font-black uppercase tracking-wider leading-none"
                    style={{ color: isDarkBg ? '#ffffff' : restaurante.color_principal }}
                  >
                    Sugerencias del Chef
                  </h2>
                  <p
                    className={`text-[11px] mt-1 ${
                      isDarkBg ? 'text-white/65' : 'text-slate-600'
                    }`}
                  >
                    Selección recomendada de nuestra cocina
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {sugerenciasFiltradas.map((prod) => renderDishCard(prod, true))}
            </div>
          </section>
        )}

        {noHayResultados ? (
          <div
            className={`text-center py-14 px-4 rounded-2xl border text-sm ${
              isDarkBg
                ? 'bg-white/5 border-white/10 text-slate-300'
                : 'bg-white/60 border-slate-200/60 text-slate-500'
            }`}
          >
            {searchTerm
              ? `No encontramos platos que coincidan con "${searchTerm}".`
              : 'No hay productos disponibles en este momento.'}
          </div>
        ) : (
          categoriasOrdenadas.map((categoria) => (
            <section
              key={categoria}
              id={`cat-${encodeURIComponent(categoria)}`}
              className="scroll-mt-32"
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  aria-hidden="true"
                  className="h-5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: restaurante.color_principal }}
                />
                <h2
                  className="text-base sm:text-lg font-black uppercase tracking-wide"
                  style={{ color: isDarkBg ? '#f8fafc' : restaurante.color_principal }}
                >
                  {categoria}
                </h2>
                <div
                  className={`flex-1 h-px ${
                    isDarkBg ? 'bg-white/10' : 'bg-slate-300/60'
                  }`}
                />
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isDarkBg
                      ? 'bg-white/10 text-slate-300'
                      : 'bg-black/5 text-slate-500'
                  }`}
                >
                  {productosPorCategoria[categoria].length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {productosPorCategoria[categoria].map((prod) => renderDishCard(prod, false))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* FOOTER */}
      <footer
        className={`text-center mt-16 py-8 border-t ${
          isDarkBg ? 'border-white/10' : 'border-slate-200/60'
        }`}
      >
        <p className="text-[11px] text-slate-400 mb-1">Carta digital potenciada por</p>
        <a
          href="https://cocinapp.online"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-black text-sm text-brand-600 hover:text-brand-700 transition-colors"
        >
          <ChefHat size={16} />
          CocinApp
        </a>
        <p className="mt-3 text-[11px] text-slate-400">
          ¿Tenés un restaurante?{' '}
          <a
            href="https://cocinapp.online"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-500 hover:underline underline-offset-2"
          >
            Creá tu menú gratis
          </a>
        </p>
      </footer>

      {/* BARRA FLOTANTE "MI PEDIDO" (Intuitiva, con pulso al agregar y acceso directo a WhatsApp) */}
      {showDeliveryActions && cart.length > 0 && (
        <div className="fixed bottom-4 inset-x-0 z-40 px-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-white shadow-2xl transition-all duration-300 active:scale-[0.99] ${
                cartHighlight
                  ? 'scale-[1.03] ring-4 ring-[#25D366] brightness-110'
                  : 'hover:brightness-105 ring-1 ring-white/15'
              }`}
              style={{ backgroundColor: restaurante.color_principal }}
            >
              {/* Izquierda: Contador + "Mi pedido" + "Enviar por WhatsApp" */}
              <div className="flex items-center gap-3 text-left min-w-0">
                <span
                  className={`inline-flex items-center justify-center h-9 min-w-9 px-2.5 rounded-xl text-sm font-black tabular-nums transition-transform ${
                    cartHighlight
                      ? 'bg-[#25D366] text-white scale-110'
                      : 'bg-white text-slate-900'
                  }`}
                >
                  {totalCartItems}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black leading-tight tracking-tight">
                      Mi pedido
                    </span>
                    {cartHighlight && lastAddedName && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#25D366] text-white px-2 py-0.5 rounded-full truncate max-w-[160px] sm:max-w-[220px]">
                        <Check size={11} strokeWidth={3} />
                        {lastAddedName}
                      </span>
                    )}
                  </div>

                  <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold text-white/95">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#25D366] text-white shrink-0 shadow-2xs">
                      <ContactIcon tipo="whatsapp" size={10} />
                    </span>
                    <span>Enviar por WhatsApp</span>
                  </span>
                </div>
              </div>

              {/* Derecha: Total + flecha clara de acción */}
              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <div className="text-right">
                  <span className="block text-[10px] uppercase tracking-wider text-white/75 font-semibold">
                    Total
                  </span>
                  <span className="text-base sm:text-lg font-black tabular-nums leading-none">
                    ${totalCartAmount.toLocaleString()}
                  </span>
                </div>
                <ChevronRight size={20} className="text-white/85" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DE PLATO (Con selector de cantidad y nota en Modo Delivery) */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-in slide-in-from-bottom-4 duration-200"
            style={{ backgroundColor: cardBg, color: textoColor }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedProduct.image_url && (
              <div className="relative h-56 w-full bg-black/10">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Cerrar detalle"
                  className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2 text-white"
                    style={{ backgroundColor: restaurante.color_principal }}
                  >
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-xl font-black leading-snug">{selectedProduct.name}</h3>
                </div>
                {!selectedProduct.image_url && (
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    aria-label="Cerrar detalle"
                    className="h-8 w-8 rounded-full bg-black/10 flex items-center justify-center shrink-0 hover:bg-black/20 transition"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {selectedProduct.description && (
                <p className="text-sm opacity-85 mt-3 leading-relaxed">
                  {selectedProduct.description}
                </p>
              )}

              {/* Campo de nota opcional solo en Modo Delivery */}
              {showDeliveryActions && (
                <div className="mt-5">
                  <label
                    htmlFor="dish-note"
                    className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-1.5"
                  >
                    Nota o aclaración para la cocina (opcional)
                  </label>
                  <input
                    id="dish-note"
                    type="text"
                    placeholder="ejemplos sin mayo"
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-3 text-sm border focus:outline-none ${
                      isDarkCard
                        ? 'bg-white/10 border-white/20 text-white placeholder:text-white/45 focus:border-white/50'
                        : 'bg-black/[0.04] border-black/15 text-slate-900 placeholder:text-slate-500 focus:border-black/40'
                    }`}
                  />
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-current/10 flex items-center justify-between gap-3">
                {showDeliveryActions ? (
                  <>
                    {/* Selector de cantidad grande y fácil de tocar */}
                    <div
                      className={`inline-flex items-center rounded-xl border p-1 ${
                        isDarkCard ? 'border-white/20 bg-white/5' : 'border-black/15 bg-black/[0.03]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                        aria-label="Restar unidad"
                        className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-black/10 transition"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-9 text-center text-base font-black tabular-nums">
                        {modalQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalQuantity((q) => q + 1)}
                        aria-label="Sumar unidad"
                        className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-black/10 transition"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addToCart(selectedProduct, modalQuantity, modalNote);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 py-3.5 px-4 rounded-2xl text-white font-bold text-sm sm:text-base shadow-lg transition hover:brightness-110 active:scale-95 tabular-nums"
                      style={{ backgroundColor: restaurante.color_principal }}
                    >
                      Pedir • ${(selectedProduct.price * modalQuantity).toLocaleString()}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="block text-[11px] uppercase tracking-wider opacity-60 font-semibold">
                        Precio
                      </span>
                      <span className="text-2xl font-black tabular-nums">
                        ${selectedProduct.price.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition"
                      style={{ backgroundColor: restaurante.color_principal }}
                    >
                      Listo
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL DEL CARRITO MULTI-ÍTEM ("MI PEDIDO") */}
      {isCartOpen && showDeliveryActions && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="w-full sm:max-w-lg max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-in slide-in-from-bottom-4 duration-200"
            style={{ backgroundColor: cardBg, color: textoColor }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del carrito */}
            <div className="px-6 py-4 border-b border-current/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} style={{ color: restaurante.color_principal }} />
                <h3 className="text-lg font-black tracking-tight">Mi pedido</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Cerrar mi pedido"
                className="h-9 w-9 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lista de ítems con notas editables */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {cart.length === 0 ? (
                <p className="text-center text-sm opacity-75 py-8">
                  Todavía no agregaste platos a tu pedido.
                </p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div
                      key={item.lineId}
                      className={`p-3.5 rounded-2xl border space-y-2.5 ${
                        isDarkCard
                          ? 'border-white/15 bg-white/[0.04]'
                          : 'border-black/10 bg-black/[0.02]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm sm:text-base leading-snug">
                            {item.product.name}
                          </h4>
                          <span className="text-xs sm:text-sm font-extrabold opacity-80 tabular-nums">
                            ${(item.product.price * item.quantity).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div
                            className={`inline-flex items-center rounded-lg border p-0.5 ${
                              isDarkCard ? 'border-white/20' : 'border-black/15'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => updateCartItemQuantity(item.lineId, -1)}
                              aria-label="Quitar una unidad"
                              className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-black/10 transition"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-7 text-center text-sm font-black tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartItemQuantity(item.lineId, 1)}
                              aria-label="Agregar una unidad"
                              className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-black/10 transition"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCartItem(item.lineId)}
                            aria-label="Eliminar plato"
                            className="h-9 w-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/10 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Campo editable de nota por ítem */}
                      <input
                        type="text"
                        placeholder="Opcional Nota o aclaracion ejemplo sin mayo"
                        value={item.note}
                        onChange={(e) => updateCartItemNote(item.lineId, e.target.value)}
                        aria-label={`Nota para ${item.product.name}`}
                        className={`w-full rounded-xl px-3 py-2 text-xs sm:text-sm border focus:outline-none ${
                          isDarkCard
                            ? 'bg-white/10 border-white/15 text-white placeholder:text-white/45 focus:border-white/40'
                            : 'bg-white border-black/15 text-slate-800 placeholder:text-slate-500 focus:border-black/30'
                        }`}
                      />
                    </div>
                  ))}

                  {/* Campo opcional de dirección / retiro */}
                  <div className="pt-2">
                    <label
                      htmlFor="customer-address"
                      className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-1.5"
                    >
                      Dirección de entrega o retiro (opcional)
                    </label>
                    <input
                      id="customer-address"
                      type="text"
                      placeholder="Ej: Av. Rivadavia 4520, Piso 2 / Retiro en local"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className={`w-full rounded-xl px-3.5 py-3 text-sm border focus:outline-none ${
                        isDarkCard
                          ? 'bg-white/10 border-white/20 text-white placeholder:text-white/45 focus:border-white/50'
                          : 'bg-black/[0.04] border-black/15 text-slate-900 placeholder:text-slate-500 focus:border-black/40'
                      }`}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Pie del carrito con total y envío a WhatsApp */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-current/10 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold opacity-80">Total estimado</span>
                  <span className="text-2xl font-black tabular-nums">
                    ${totalCartAmount.toLocaleString()}
                  </span>
                </div>

                <a
                  href={buildFullWhatsappOrderUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-5 rounded-2xl bg-[#25D366] hover:brightness-105 text-white font-black text-base shadow-lg transition active:scale-[0.99]"
                >
                  <ContactIcon tipo="whatsapp" size={20} />
                  Enviar por WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}