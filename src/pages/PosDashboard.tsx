// src/pages/PosDashboard.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { usePosStore } from '@/stores/usePosStore';
import {
  ShoppingCart, Trash2, ArrowLeft, Loader2, Search, Plus, Minus,
  CreditCard, Banknote, Printer, Save, Divide, Percent, UserRound,
  Settings2, Share2, ChevronUp, X, DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from '@/stores/useToastStore';
import { SectionHint } from '@/components/ui/section-hint';
import { cn } from '@/lib/utils';
import { usePosSettingsStore, type DiscountMode } from '@/stores/usePosSettingsStore';
import { PosSettingsModal } from '@/components/modals/PosSettingsModal';
import {
  printTicket,
  buildTicketCanvas,
  canvasToTicketFile,
  type TicketData,
} from '@/lib/ticket';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  status: string;
}

interface RestaurantePOSInfo {

   nombre: string;
  direccion: string | null;
  whatsapp: string | null;
  logo_url: string | null;
  color_principal: string;
}
  

export default function PosDashboard() {
  const {
    orderItems, addItem, decreaseItem, removeItem, getTotal,
    clearOrder, currentTableId, tableName,
  } = usePosStore();
  const { restauranteId } = useAuthStore();
  const { cardSurcharge, defaultDiscountMode, paperWidth  } = usePosSettingsStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [restauranteInfo, setRestauranteInfo] = useState<RestaurantePOSInfo>({
    nombre: '',
    direccion: null,
    whatsapp: null,
    logo_url: null,
    color_principal: '#f97316',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('__all__');

  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta'>('Efectivo');
  const [selectedTable, setSelectedTable] = useState(tableName || '');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [discountMode, setDiscountMode] = useState<DiscountMode>(defaultDiscountMode);
  const [splitCount, setSplitCount] = useState<number>(1);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const cartScrollRef = useRef<HTMLDivElement>(null);

  // Sync defaultDiscountMode cuando cambia el setting
  useEffect(() => {
    setDiscountMode(defaultDiscountMode);
  }, [defaultDiscountMode]);

  useEffect(() => {
    if (tableName) setSelectedTable(tableName);
  }, [tableName]);

  useEffect(() => {
    if (restauranteId) fetchDatos();
  }, [restauranteId]);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      const [prodRes, restRes] = await Promise.all([
        supabase
          .from('productos')
          .select('*')
          .eq('status', 'Activo')
          .eq('restaurante_id', restauranteId)
          .order('category', { ascending: true }),
        supabase
          .from('restaurantes')
          .select('nombre, direccion, whatsapp, logo_url, color_principal')
          .eq('id', restauranteId)
          .single(),

      ]);

      if (prodRes.error) throw prodRes.error;
      if (prodRes.data) setProducts(prodRes.data);

      if (restRes.data) {
        setRestauranteInfo({
          nombre: restRes.data.nombre || '',
          direccion: restRes.data.direccion || null,
          whatsapp: restRes.data.whatsapp || null,
          logo_url: restRes.data.logo_url || null,
          color_principal: restRes.data.color_principal || '#f97316',
        });
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('No pudimos cargar el catálogo', 'Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Categorías únicas
  const categorias = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        activeCategory === '__all__' || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

  // ── Cálculos ──────────────────────────────────────────────
  const subTotal = getTotal();
  const discountNum = parseFloat(discountValue) || 0;

  const discountAmount = useMemo(() => {
    if (discountNum <= 0) return 0;
    if (discountMode === 'percent') {
      return Math.min(subTotal * (discountNum / 100), subTotal);
    }
    return Math.min(discountNum, subTotal);
  }, [discountNum, discountMode, subTotal]);

  const afterDiscount = subTotal - discountAmount;
  const surcharge = paymentMethod === 'Tarjeta' ? afterDiscount * (cardSurcharge / 100) : 0;
  const finalTotal = afterDiscount + surcharge;
  const amountPerPerson = splitCount > 1 ? finalTotal / splitCount : finalTotal;

  // ── Ticket data helper ────────────────────────────────────
  const buildTicketData = (): TicketData => {
    const items = orderItems.map((item) => {
      const precioUnitario = item.price;
      return {
        name: item.name,
        quantity: item.quantity,
        price: precioUnitario,
        originalPrice: precioUnitario,
      };
    });

    // Distribuir el descuento proporcionalmente para reflejar en los items si fuera necesario.
    // Por ahora usamos los precios originales y mostramos el descuento aparte en el ticket.
    return {
      restaurante: {
        nombre: restauranteInfo.nombre || 'CocinApp',
        direccion: restauranteInfo.direccion,
        whatsapp: restauranteInfo.whatsapp,
        logo_url: restauranteInfo.logo_url,
        color_principal: restauranteInfo.color_principal,
          },

        
      items,
      mesa: selectedTable || 'Caja',
      fecha: new Date(),
      subtotal: subTotal,
      discountValue: discountAmount,
      discountMode,
      discountAmountRaw: discountNum,
      surchargeValue: surcharge,
      surchargePct: cardSurcharge,
      paymentMethod,
      total: finalTotal,
      splitCount,
      amountPerPerson,
      paperWidth,   // ← NUEVO

    };
  };

  // ── Guardar cuenta ────────────────────────────────────────
  const handleSaveOrder = async () => {
    if (!selectedTable) {
      toast.warning('Falta la mesa', 'Asigná un número o nombre de mesa antes de guardar.');
      return;
    }
    if (orderItems.length === 0) {
      toast.warning('La cuenta está vacía', 'Agregá productos antes de guardar.');
      return;
    }

    setIsSubmitting(true);
    try {
      let targetVentaId = currentTableId;

      if (!targetVentaId) {
        const { data: existingTable } = await supabase
          .from('ventas')
          .select('id')
          .eq('restaurante_id', restauranteId)
          .eq('mesa', selectedTable.trim())
          .eq('status', 'Abierto')
          .maybeSingle();

        if (existingTable) targetVentaId = existingTable.id;
      }

      if (targetVentaId) {
        const { error: updateVentaError } = await supabase
          .from('ventas')
          .update({ total: finalTotal, mesa: selectedTable.trim() })
          .eq('id', targetVentaId);
        if (updateVentaError) throw updateVentaError;

        const { error: deleteError } = await supabase
          .from('venta_items')
          .delete()
          .eq('venta_id', targetVentaId);
        if (deleteError) throw deleteError;

        const itemsToInsert = orderItems.map((item) => ({
          venta_id: targetVentaId,
          producto_id: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }));
        const { error: insertItemsError } = await supabase
          .from('venta_items')
          .insert(itemsToInsert);
        if (insertItemsError) throw insertItemsError;

        toast.success(`Mesa "${selectedTable}" actualizada`, 'La cuenta quedó guardada y abierta.');
      } else {
        const { data: ventaData, error: ventaError } = await supabase
          .from('ventas')
          .insert([
            {
              total: finalTotal,
              status: 'Abierto',
              metodo_pago: 'Pendiente',
              restaurante_id: restauranteId,
              mesa: selectedTable.trim(),
            },
          ])
          .select();
        if (ventaError) throw ventaError;

        const itemsToInsert = orderItems.map((item) => ({
          venta_id: ventaData[0].id,
          producto_id: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }));
        const { error: itemsError } = await supabase.from('venta_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        toast.success(`Mesa "${selectedTable}" abierta`, 'Podés seguir cargando productos cuando quieras.');
      }

      clearOrder();
      setSelectedTable('');
      setDiscountValue('');
      setSplitCount(1);
    } catch (error) {
      console.error('Error al guardar mesa:', error);
      toast.error(
        'No pudimos guardar la cuenta',
        error instanceof Error ? error.message : 'Revisá tu conexión e intentá de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Cobrar ────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (orderItems.length === 0) {
      toast.warning('La cuenta está vacía', 'Agregá productos antes de cobrar.');
      return;
    }
    setIsSubmitting(true);

    try {
      if (currentTableId) {
        const { error: updateError } = await supabase
          .from('ventas')
          .update({
            total: finalTotal,
            status: 'Pagado',
            metodo_pago: paymentMethod,
            mesa: selectedTable,
          })
          .eq('id', currentTableId);
        if (updateError) throw updateError;
      } else {
        const { data: ventaData, error: ventaError } = await supabase
          .from('ventas')
          .insert([
            {
              total: finalTotal,
              status: 'Pagado',
              metodo_pago: paymentMethod,
              restaurante_id: restauranteId,
              mesa: selectedTable || 'Caja',
            },
          ])
          .select();
        if (ventaError) throw ventaError;

        const itemsToInsert = orderItems.map((item) => ({
          venta_id: ventaData[0].id,
          producto_id: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }));
        const { error: itemsError } = await supabase.from('venta_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      clearOrder();
      setPaymentMethod('Efectivo');
      setDiscountValue('');
      setSplitCount(1);
      setSelectedTable('');
      setIsMobileCartOpen(false);

      toast.success(
        '¡Cobro exitoso!',
        `Total cobrado: $${finalTotal.toLocaleString('es-AR')} (${paymentMethod}).`
      );
    } catch (error) {
      console.error('Error al cobrar:', error);
      toast.error(
        'No pudimos procesar el cobro',
        error instanceof Error ? error.message : 'Revisá tu conexión e intentá de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Imprimir ticket ───────────────────────────────────────
  const handlePrint = async () => {
    if (orderItems.length === 0) {
      toast.warning('La cuenta está vacía', 'Agregá productos antes de imprimir.');
      return;
    }
    try {
      setIsPrinting(true);
      printTicket(buildTicketData());
    } catch (error) {
      console.error('Error al imprimir:', error);
      toast.error(
        'No pudimos abrir la impresión',
        error instanceof Error ? error.message : 'Verificá los permisos de ventanas emergentes.'
      );
    } finally {
      setIsPrinting(false);
    }
  };

  // ── Compartir ticket por WhatsApp (imagen) ────────────────
  const handleShare = async () => {
    if (orderItems.length === 0) {
      toast.warning('La cuenta está vacía', 'Agregá productos antes de compartir.');
      return;
    }
    setIsSharing(true);

    try {
      const canvas = await buildTicketCanvas(buildTicketData());
      const fileName = `ticket-${(selectedTable || 'caja').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      const file = await canvasToTicketFile(canvas, fileName);
      if (!file) throw new Error('No se pudo generar la imagen');

      const canShareFiles =
        typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

      if (canShareFiles) {
        try {
          await navigator.share({
            files: [file],
            title: `Ticket - ${restauranteInfo.nombre}`,
            text: `Ticket de ${selectedTable || 'Caja'} — Total: $${finalTotal.toLocaleString('es-AR')}`,
          });
        } catch (err) {
          if ((err as Error).name !== 'AbortError') throw err;
        }
      } else {
        // Fallback: descargar imagen
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.info(
          'Imagen descargada',
          'Adjuntala manualmente en WhatsApp o Instagram.'
        );
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      toast.error(
        'No pudimos compartir el ticket',
        error instanceof Error ? error.message : 'Intentá de nuevo.'
      );
    } finally {
      setIsSharing(false);
    }
  };

  // ── UI helpers ────────────────────────────────────────────
  const totalItemCount = orderItems.reduce((acc, item) => acc + item.quantity, 0);

  const CarritoContenido = (
    <>
      {/* Header del carrito */}
      <div className="p-3 sm:p-4 bg-ink-900 dark:bg-ink-950 text-white space-y-3 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} />
            <h3 className="font-bold text-lg">Cuenta Actual</h3>
            {currentTableId && (
              <span className="bg-brand-500 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ml-1">
                Editando
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearOrder}
              disabled={orderItems.length === 0}
              className="text-ink-400 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium uppercase tracking-wider transition-colors px-2"
            >
              Limpiar
            </button>
            {/* Cerrar solo en mobile */}
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="lg:hidden text-ink-400 hover:text-white p-1 -mr-1"
              aria-label="Cerrar carrito"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-400 whitespace-nowrap">Mesa:</span>
          <Input
            placeholder="Ej. Mesa 4 / Barra"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="h-8 bg-ink-800 border-ink-700 text-white placeholder:text-ink-500 focus-visible:ring-brand-500"
          />
        </div>
      </div>

      {/* Listado de items */}
      <div
        ref={cartScrollRef}
        className="flex-1 p-3 overflow-y-auto scrollbar-thin space-y-2 bg-ink-50 dark:bg-ink-900/50 min-h-0"
      >
        {orderItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-ink-400 dark:text-ink-600">
            <ShoppingCart size={48} className="mb-4 opacity-20" />
            <p>El carrito está vacío</p>
          </div>
        ) : (
          orderItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-ink-800 p-3 rounded-lg border border-ink-200 dark:border-ink-700 shadow-sm flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <p className="font-semibold text-ink-800 dark:text-ink-200 leading-tight pr-4">
                  {item.name}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="h-6 w-6 text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 -mr-1 -mt-1"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="font-bold text-ink-600 dark:text-ink-300">
                  ${item.price.toLocaleString('es-AR')}
                </span>

                <div className="flex items-center bg-ink-100 dark:bg-ink-900 rounded-lg p-1 border border-ink-200 dark:border-ink-700">
                  <button
                    onClick={() => decreaseItem(item.productId)}
                    className="w-8 h-8 flex items-center justify-center bg-white dark:bg-ink-800 rounded shadow-sm hover:bg-ink-50 dark:hover:bg-ink-700 text-ink-700 dark:text-ink-300"
                    aria-label="Restar cantidad"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-bold text-ink-800 dark:text-ink-100">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => addItem({ ...item, quantity: 1 })}
                    className="w-8 h-8 flex items-center justify-center bg-white dark:bg-ink-800 rounded shadow-sm hover:bg-ink-50 dark:hover:bg-ink-700 text-ink-700 dark:text-ink-300"
                    aria-label="Sumar cantidad"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer del carrito */}
      <div className="p-3 sm:p-4 bg-white dark:bg-ink-900 border-t border-ink-200 dark:border-ink-800 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] shrink-0">
        {/* Descuento + División */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <div className="flex items-stretch">
              <button
                type="button"
                onClick={() =>
                  setDiscountMode((m) => (m === 'percent' ? 'amount' : 'percent'))
                }
                className="shrink-0 grid place-items-center w-10 rounded-l-field border border-r-0 border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-xs font-bold text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
                title="Alternar entre % y monto fijo"
                aria-label="Alternar modo de descuento"
              >
                {discountMode === 'percent' ? <Percent size={14} /> : <DollarSign size={14} />}
              </button>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder={discountMode === 'percent' ? 'Desc %' : 'Desc $'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="rounded-l-none dark:bg-ink-800 dark:border-ink-700 dark:text-white h-10"
                title={
                  discountMode === 'percent'
                    ? 'Descuento en porcentaje'
                    : 'Descuento en pesos'
                }
              />
            </div>
          </div>
          <div className="flex-1 relative">
            <Divide className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
            <Input
              type="number"
              min="1"
              placeholder="Dividir /"
              value={splitCount || ''}
              onChange={(e) => setSplitCount(Number(e.target.value))}
              className="pl-9 dark:bg-ink-800 dark:border-ink-700 dark:text-white h-10"
              title="Dividir cuenta entre X personas"
            />
          </div>
        </div>

        {/* Método de pago */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => setPaymentMethod('Efectivo')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-semibold transition-all ${
              paymentMethod === 'Efectivo'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
            }`}
          >
            <Banknote size={18} /> Efectivo
          </button>
          <button
            onClick={() => setPaymentMethod('Tarjeta')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-semibold transition-all ${
              paymentMethod === 'Tarjeta'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                : 'border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
            }`}
          >
            <CreditCard size={18} /> Tarjeta
          </button>
        </div>

        {/* Totales */}
        <div className="space-y-1.5 mb-3 text-sm font-medium">
          <div className="flex justify-between text-ink-500 dark:text-ink-400">
            <span>Subtotal</span>
            <span>${subTotal.toLocaleString('es-AR')}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>
                Descuento{' '}
                {discountMode === 'percent' ? `(${discountNum}%)` : ''}
              </span>
              <span>- ${Math.round(discountAmount).toLocaleString('es-AR')}</span>
            </div>
          )}
          {paymentMethod === 'Tarjeta' && surcharge > 0 && (
            <div className="flex justify-between text-brand-600 dark:text-brand-400">
              <span>Recargo Tarjeta ({cardSurcharge}%)</span>
              <span>+ ${Math.round(surcharge).toLocaleString('es-AR')}</span>
            </div>
          )}

          <div className="flex justify-between items-end pt-2 border-t border-ink-100 dark:border-ink-800">
            <span className="text-ink-800 dark:text-ink-200 font-bold text-lg">Total</span>
            <span className="text-3xl sm:text-4xl font-black text-ink-900 dark:text-white tracking-tight">
              ${Math.round(finalTotal).toLocaleString('es-AR')}
            </span>
          </div>

          {splitCount > 1 && (
            <div className="flex justify-between items-center text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 p-2 rounded-lg mt-2">
              <span className="flex items-center gap-2">
                <UserRound size={16} /> Cada uno paga:
              </span>
              <span className="font-bold text-lg">
                ${Math.round(amountPerPerson).toLocaleString('es-AR')}
              </span>
            </div>
          )}
        </div>

        {/* Acciones secundarias: Imprimir, Compartir */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            disabled={orderItems.length === 0 || isPrinting}
            className="h-10 text-xs border-ink-200 dark:border-ink-700 dark:text-ink-200"
          >
            <Printer size={16} className="mr-2" />
            Imprimir
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleShare}
            disabled={orderItems.length === 0 || isSharing}
            className="h-10 text-xs border-ink-200 dark:border-ink-700 dark:text-ink-200"
          >
            {isSharing ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Share2 size={16} className="mr-2" />
            )}
            Compartir
          </Button>
        </div>

        {/* CTA principal */}
        <div className="flex gap-2">
          <Button
            onClick={handleSaveOrder}
            disabled={orderItems.length === 0 || isSubmitting}
            variant="outline"
            className="w-1/3 h-14 border-2 border-ink-300 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 flex flex-col items-center justify-center gap-1"
          >
            <Save size={18} />
            <span className="text-xs">Guardar</span>
          </Button>

          <Button
            onClick={handleCheckout}
            disabled={orderItems.length === 0 || isSubmitting}
            className={`w-2/3 h-14 text-xl font-bold shadow-lg transition-all text-white ${
              paymentMethod === 'Efectivo'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-brand-500 hover:bg-brand-600'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              `Cobrar $${Math.round(finalTotal).toLocaleString('es-AR')}`
            )}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-ink-100 dark:bg-ink-950 font-sans transition-colors duration-300 overflow-hidden">

      {/* ══════════════════════════════════════════════════════
          SECCIÓN IZQUIERDA: Catálogo
          ══════════════════════════════════════════════════════ */}
      <section className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">

        {/* Header */}
        <div className="bg-white dark:bg-ink-900 px-3 sm:px-4 py-3 border-b border-ink-200 dark:border-ink-800 flex items-center gap-2 z-10 shadow-sm transition-colors shrink-0">
          <Link to="/admin" aria-label="Volver al inicio">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft size={20} />
            </Button>
          </Link>

          <div className="hidden sm:flex">
            <SectionHint text="Cargá pedidos rápidos en mesa o mostrador. Aplicá descuentos, dividí la cuenta y cobrá en 1 clic." />
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
            <Input
              autoFocus
              placeholder="Buscar plato o categoría..."
              className="w-full pl-10 bg-ink-100 dark:bg-ink-800 border-transparent focus:bg-white dark:focus:bg-ink-700 text-base h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Ajustes del POS"
            title="Ajustes del POS"
            className="shrink-0"
          >
            <Settings2 size={20} />
          </Button>
        </div>

        {/* Chips de categorías */}
        {categorias.length > 0 && (
          <div className="bg-white dark:bg-ink-900 px-3 sm:px-4 pb-3 border-b border-ink-200 dark:border-ink-800 shrink-0 transition-colors">
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
              <button
                onClick={() => setActiveCategory('__all__')}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                  activeCategory === '__all__'
                    ? 'bg-brand-500 text-white'
                    : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
                )}
              >
                Todo
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap',
                    activeCategory === cat
                      ? 'bg-brand-500 text-white'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid de productos */}
        <div className="flex-1 p-3 sm:p-5 pb-24 lg:pb-5 overflow-y-auto scrollbar-thin min-h-0">
          {loading ? (
            <div className="flex h-full items-center justify-center text-ink-500 dark:text-ink-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-ink-500 dark:text-ink-400 p-6">
              <div>
                <Search className="h-12 w-12 mx-auto text-ink-300 dark:text-ink-700 mb-3" />
                <p>
                  No se encontraron productos
                  {searchTerm ? ` para "${searchTerm}"` : ''}.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() =>
                    addItem({ ...product, productId: product.id, quantity: 1 })
                  }
                  className="bg-white dark:bg-ink-900 p-3 rounded-card shadow-sm border border-ink-200 dark:border-ink-800
                             hover:border-brand-400 dark:hover:border-brand-500 active:scale-95
                             transition-all text-left flex flex-col justify-between min-h-[110px] select-none"
                >
                  <div>
                    <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider line-clamp-1">
                      {product.category}
                    </span>
                    <p className="font-semibold text-ink-800 dark:text-ink-100 leading-tight mt-1 line-clamp-2 text-sm">
                      {product.name}
                    </p>
                  </div>
                  <span className="text-ink-900 dark:text-white font-black text-base">
                    ${product.price.toLocaleString('es-AR')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CARRITO — DESKTOP (columna derecha, siempre visible)
          ══════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex w-[400px] xl:w-[420px] bg-white dark:bg-ink-900 border-l border-ink-200 dark:border-ink-800 flex-col shadow-2xl z-20 min-h-0 transition-colors">
        {CarritoContenido}
      </aside>

      {/* ══════════════════════════════════════════════════════
          BARRA INFERIOR FIJA — MOBILE
          ══════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-ink-900 border-t border-ink-200 dark:border-ink-800 shadow-2xl">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          disabled={orderItems.length === 0}
          className={cn(
            'w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors',
            orderItems.length === 0
              ? 'opacity-60 cursor-not-allowed'
              : 'active:bg-ink-50 dark:active:bg-ink-800'
          )}
          aria-label="Ver cuenta"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart size={22} className="text-ink-700 dark:text-ink-200" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 grid place-items-center">
                  {totalItemCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
                {orderItems.length === 0
                  ? 'Sin productos'
                  : `${totalItemCount} ítem${totalItemCount !== 1 ? 's' : ''}`}
              </p>
              <p className="text-base font-bold text-ink-900 dark:text-white leading-tight">
                ${Math.round(finalTotal).toLocaleString('es-AR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-semibold text-sm">
            Ver cuenta
            <ChevronUp size={18} />
          </div>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          SHEET FULL-SCREEN DEL CARRITO — MOBILE
          ══════════════════════════════════════════════════════ */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col bg-white dark:bg-ink-900 animate-in slide-in-from-bottom duration-200">
          {CarritoContenido}
        </div>
      )}

      {/* Modal de ajustes */}
      <PosSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}