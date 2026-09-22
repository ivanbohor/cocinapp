// src/pages/PosDashboard.tsx
import { useState, useEffect } from 'react';
import { usePosStore } from '@/stores/usePosStore';
import {
  ShoppingCart, Trash2, ArrowLeft, Loader2, Search, Plus, Minus,
  CreditCard, Banknote, Printer, Save, Divide, Percent, UserRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from '@/stores/useToastStore';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  status: string;
}

export default function PosDashboard() {
  const { orderItems, addItem, decreaseItem, removeItem, getTotal, clearOrder, currentTableId, tableName } = usePosStore();
  const { restauranteId } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta'>('Efectivo');
  const [selectedTable, setSelectedTable] = useState(tableName || '');
  const [discount, setDiscount] = useState<number>(0);
  const [splitCount, setSplitCount] = useState<number>(1);
  const [printTicket, setPrintTicket] = useState(true);

  useEffect(() => {
    if (tableName) {
      setSelectedTable(tableName);
    }
  }, [tableName]);

  useEffect(() => {
    if (restauranteId) fetchActiveProducts();
  }, [restauranteId]);

  const fetchActiveProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('status', 'Activo')
        .eq('restaurante_id', restauranteId)
        .order('category', { ascending: true });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('No pudimos cargar el catálogo', 'Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subTotal = getTotal();
  const discountAmount = subTotal * (discount / 100);
  const afterDiscount = subTotal - discountAmount;
  const surcharge = paymentMethod === 'Tarjeta' ? afterDiscount * 0.10 : 0;
  const finalTotal = afterDiscount + surcharge;
  const amountPerPerson = splitCount > 1 ? finalTotal / splitCount : finalTotal;

  // ============================================
  // GUARDAR CUENTA (Mesa abierta sin cobrar)
  // ============================================
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

        if (existingTable) {
          targetVentaId = existingTable.id;
        }
      }

      if (targetVentaId) {
        const { error: updateVentaError } = await supabase
          .from('ventas')
          .update({
            total: finalTotal,
            mesa: selectedTable.trim()
          })
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
          price: item.price
        }));

        const { error: insertItemsError } = await supabase.from('venta_items').insert(itemsToInsert);
        if (insertItemsError) throw insertItemsError;

        toast.success(`Mesa "${selectedTable}" actualizada`, 'La cuenta quedó guardada y abierta.');
      } else {
        const { data: ventaData, error: ventaError } = await supabase
          .from('ventas')
          .insert([{
            total: finalTotal,
            status: 'Abierto',
            metodo_pago: 'Pendiente',
            restaurante_id: restauranteId,
            mesa: selectedTable.trim()
          }])
          .select();

        if (ventaError) throw ventaError;

        const itemsToInsert = orderItems.map((item) => ({
          venta_id: ventaData[0].id,
          producto_id: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }));

        const { error: itemsError } = await supabase.from('venta_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        toast.success(`Mesa "${selectedTable}" abierta`, 'Podés seguir cargando productos cuando quieras.');
      }

      clearOrder();
      setSelectedTable('');
      setDiscount(0);
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

  // ============================================
  // COBRAR (cerrar la venta)
  // ============================================
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
            mesa: selectedTable
          })
          .eq('id', currentTableId);

        if (updateError) throw updateError;
      } else {
        const { data: ventaData, error: ventaError } = await supabase
          .from('ventas')
          .insert([{
            total: finalTotal,
            status: 'Pagado',
            metodo_pago: paymentMethod,
            restaurante_id: restauranteId,
            mesa: selectedTable || 'Caja'
          }])
          .select();

        if (ventaError) throw ventaError;

        const itemsToInsert = orderItems.map((item) => ({
          venta_id: ventaData[0].id,
          producto_id: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }));

        const { error: itemsError } = await supabase.from('venta_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      if (printTicket) {
        console.log("Enviando orden a impresora...");
      }

      clearOrder();
      setPaymentMethod('Efectivo');
      setDiscount(0);
      setSplitCount(1);
      setSelectedTable('');

      toast.success(
        '¡Cobro exitoso!',
        `Total cobrado: $${finalTotal.toLocaleString()} (${paymentMethod}).`
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

  // ============================================
  // RENDER
  // ============================================
  // 🔄 OLA 2E: Mobile-first con alturas controladas.
  //   - En mobile (< lg): layout en columna, carrito con altura máxima y scroll propio.
  //   - En desktop (lg+): split layout con panel derecho de 420px, scroll interno.
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-ink-100 dark:bg-ink-950 font-sans transition-colors duration-300 overflow-hidden">

      {/* ============================== */}
      {/* SECCIÓN IZQUIERDA: Catálogo */}
      {/* ============================== */}
      <section className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">

        {/* Header del POS */}
        <div className="bg-white dark:bg-ink-900 p-3 sm:p-4 border-b border-ink-200 dark:border-ink-800 flex items-center gap-3 z-10 shadow-sm transition-colors shrink-0">
          <Link to="/admin/dashboard" aria-label="Volver al panel">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft size={20} />
            </Button>
          </Link>

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
        </div>

        {/* Grid de productos — con scroll propio */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin min-h-0">
          {loading ? (
            <div className="flex h-full items-center justify-center text-ink-500 dark:text-ink-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-ink-500 dark:text-ink-400 p-6">
              <div>
                <Search className="h-12 w-12 mx-auto text-ink-300 dark:text-ink-700 mb-3" />
                <p>No se encontraron productos{searchTerm ? ` para "${searchTerm}"` : ''}.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addItem({ ...product, productId: product.id, quantity: 1 })}
                  className="bg-white dark:bg-ink-900 p-3 sm:p-4 rounded-card shadow-sm border border-ink-200 dark:border-ink-800
                             hover:border-brand-400 dark:hover:border-brand-500 active:scale-95
                             transition-all text-left flex flex-col justify-between h-28 sm:h-32 select-none"
                >
                  <div>
                    <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
                      {product.category}
                    </span>
                    <p className="font-semibold text-ink-800 dark:text-ink-100 leading-tight mt-1 line-clamp-2">
                      {product.name}
                    </p>
                  </div>
                  <span className="text-ink-900 dark:text-white font-black text-lg">
                    ${product.price.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================== */}
      {/* SECCIÓN DERECHA: Carrito */}
      {/* ============================== */}
      {/* 🔄 OLA 2E: En mobile toma altura máxima limitada + scroll interno.
                     En desktop mantiene w-[420px] y h-full. */}
      <aside
        className="
          w-full lg:w-[420px]
          bg-white dark:bg-ink-900
          border-t lg:border-t-0 lg:border-l border-ink-200 dark:border-ink-800
          flex flex-col
          shadow-2xl z-20
          h-[70vh] lg:h-screen
          min-h-0
          transition-colors
        "
      >
        {/* Header del carrito (fijo) */}
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

            <div className="flex items-center gap-3">
              <button
                onClick={clearOrder}
                disabled={orderItems.length === 0}
                className="text-ink-400 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium uppercase tracking-wider transition-colors"
              >
                Limpiar
              </button>
              <span className="bg-ink-700 font-medium px-3 py-1 rounded-md text-sm">
                {orderItems.reduce((acc, item) => acc + item.quantity, 0)} ítems
              </span>
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

        {/* Listado de items (scroll interno) */}
        <div className="flex-1 p-3 overflow-y-auto scrollbar-thin space-y-2 bg-ink-50 dark:bg-ink-900/50 min-h-0">
          {orderItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-ink-400 dark:text-ink-600">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            orderItems.map((item) => (
              <div key={item.id} className="bg-white dark:bg-ink-800 p-3 rounded-lg border border-ink-200 dark:border-ink-700 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-ink-800 dark:text-ink-200 leading-tight pr-4">{item.name}</p>
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
                    ${item.price.toLocaleString()}
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

        {/* Footer del carrito (fijo) */}
        <div className="p-3 sm:p-4 bg-white dark:bg-ink-900 border-t border-ink-200 dark:border-ink-800 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] shrink-0">

          <div className="flex gap-3 mb-3 sm:mb-4">
            <div className="flex-1 relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
              <Input
                type="number" min="0" max="100" placeholder="Desc %"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="pl-9 dark:bg-ink-800 dark:border-ink-700 dark:text-white h-10"
                title="Descuento en porcentaje"
              />
            </div>
            <div className="flex-1 relative">
              <Divide className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
              <Input
                type="number" min="1" placeholder="Dividir /"
                value={splitCount || ''}
                onChange={(e) => setSplitCount(Number(e.target.value))}
                className="pl-9 dark:bg-ink-800 dark:border-ink-700 dark:text-white h-10"
                title="Dividir cuenta entre X personas"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 sm:mb-4">
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

          <div className="space-y-1.5 mb-3 sm:mb-4 text-sm font-medium">
            <div className="flex justify-between text-ink-500 dark:text-ink-400">
              <span>Subtotal</span>
              <span>${subTotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Descuento ({discount}%)</span>
                <span>- ${discountAmount.toLocaleString()}</span>
              </div>
            )}
            {paymentMethod === 'Tarjeta' && (
              <div className="flex justify-between text-brand-600 dark:text-brand-400">
                <span>Recargo Tarjeta (10%)</span>
                <span>+ ${surcharge.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-end pt-2 border-t border-ink-100 dark:border-ink-800">
              <span className="text-ink-800 dark:text-ink-200 font-bold text-lg">Total</span>
              <span className="text-3xl sm:text-4xl font-black text-ink-900 dark:text-white tracking-tight">
                ${finalTotal.toLocaleString()}
              </span>
            </div>

            {splitCount > 1 && (
              <div className="flex justify-between items-center text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 p-2 rounded-lg mt-2">
                <span className="flex items-center gap-2"><UserRound size={16} /> Cada uno paga:</span>
                <span className="font-bold text-lg">${amountPerPerson.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3 sm:mb-4 text-sm text-ink-600 dark:text-ink-400">
            <input
              type="checkbox"
              id="printTicket"
              checked={printTicket}
              onChange={(e) => setPrintTicket(e.target.checked)}
              className="rounded border-ink-300 text-brand-600 focus:ring-brand-500 w-4 h-4 bg-transparent"
            />
            <label htmlFor="printTicket" className="flex items-center gap-1 cursor-pointer">
              <Printer size={16} /> Imprimir Ticket al cobrar
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveOrder}
              disabled={orderItems.length === 0 || isSubmitting}
              variant="outline"
              className="w-1/3 h-14 border-2 border-ink-300 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 flex flex-col items-center justify-center gap-1"
            >
              <Save size={18} /> <span className="text-xs">Guardar</span>
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
              {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Cobrar'}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}