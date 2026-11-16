// src/components/modals/PosSettingsModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings2, RotateCcw, Percent, CreditCard, DollarSign, Printer, Calculator, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePosSettingsStore } from '@/stores/usePosSettingsStore';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function PosSettingsModal({ isOpen, onClose }: Props) {
  const {
    cardSurcharge, setCardSurcharge,
    transferEnabled, setTransferEnabled,
    transferSurchargeMode, setTransferSurchargeMode,
    transferSurchargePercent, setTransferSurchargePercent,
    tierThreshold, tierLowSurcharge, tierHighSurcharge, setTierSettings,
    defaultDiscountMode, setDefaultDiscountMode,
    paperWidth, setPaperWidth,
    roundingEnabled, setRoundingEnabled,
    resetToDefaults,tierMinPrice 
  } = usePosSettingsStore();

  const [cardInput, setCardInput] = useState(cardSurcharge.toString());
  const [transferPercentInput, setTransferPercentInput] = useState(transferSurchargePercent.toString());

  useEffect(() => {
    if (isOpen) {
      setCardInput(cardSurcharge.toString());
      setTransferPercentInput(transferSurchargePercent.toString());
    }
  }, [isOpen, cardSurcharge, transferSurchargePercent]);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSaveCard = () => {
    const num = parseFloat(cardInput);
    if (!isNaN(num) && num >= 0 && num <= 50) setCardSurcharge(num);
    else setCardInput(cardSurcharge.toString());
  };

  const handleSaveTransferPercent = () => {
    const num = parseFloat(transferPercentInput);
    if (!isNaN(num) && num >= 0 && num <= 50) setTransferSurchargePercent(num);
    else setTransferPercentInput(transferSurchargePercent.toString());
  };

  const handleReset = () => {
    resetToDefaults();
    setCardInput('10');
    setTransferPercentInput('5');
  };

  if (!isOpen) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm animate-in fade-in" />

      <div className="relative z-10 w-full max-w-md rounded-card border border-ink-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in dark:border-ink-800 dark:bg-ink-900 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-100 flex items-center gap-2">
              <Settings2 size={18} className="text-brand-500" />
              Ajustes del POS
            </h2>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
          
          {/* SECCIÓN: Tarjeta */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-2">
              <CreditCard size={16} className="text-brand-500" />
              Recargo Tarjeta (siempre activo)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number" min="0" max="50" step="0.5"
                  value={cardInput}
                  onChange={(e) => setCardInput(e.target.value)}
                  onBlur={handleSaveCard}
                  className="pr-10 dark:bg-ink-800 dark:border-ink-700 dark:text-white"
                />
                <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              </div>
            </div>
            <p className="text-xs text-ink-500">Se aplica sobre el subtotal al cobrar con Tarjeta.</p>
          </div>

          {/* SECCIÓN: Transferencia */}
          <div className="space-y-3 pt-4 border-t border-ink-100 dark:border-ink-800">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-emerald-500" />
                <span className="text-sm font-semibold text-ink-800 dark:text-ink-200">Habilitar Transferencia</span>
              </div>
              <button
                type="button" role="switch" aria-checked={transferEnabled} onClick={() => setTransferEnabled(!transferEnabled)}
                className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors', transferEnabled ? 'bg-emerald-500' : 'bg-ink-300 dark:bg-ink-700')}
              >
                <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform', transferEnabled ? 'translate-x-5' : 'translate-x-0')} />
              </button>
            </label>

            {transferEnabled && (
              <div className="space-y-3 bg-ink-50 dark:bg-ink-950/40 p-3 rounded-lg border border-ink-200 dark:border-ink-800 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button" onClick={() => setTransferSurchargeMode('percent')}
                    className={cn('rounded-field border px-3 py-2 text-xs font-medium transition-colors', transferSurchargeMode === 'percent' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-700' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800')}
                  >
                    Porcentual (%)
                  </button>
                  <button
                    type="button" onClick={() => setTransferSurchargeMode('tiers')}
                    className={cn('rounded-field border px-3 py-2 text-xs font-medium transition-colors', transferSurchargeMode === 'tiers' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-700' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800')}
                  >
                    Escalonado por Plato
                  </button>
                </div>
                                {transferSurchargeMode === 'percent' ? (
                  <div className="relative">
                    <Input
                      type="number" min="0" max="50" step="0.5"
                      value={transferPercentInput}
                      onChange={(e) => setTransferPercentInput(e.target.value)}
                      onBlur={handleSaveTransferPercent}
                      className="pr-10 dark:bg-ink-800 dark:border-ink-700 dark:text-white h-9"
                    />
                    <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-medium text-ink-600 dark:text-ink-300">
                        Monto mínimo para aplicar recargo ($)
                      </label>
                      <Input 
                        type="number" 
                        value={tierMinPrice || ''} 
                        onChange={(e) => setTierSettings(Number(e.target.value), tierThreshold, tierLowSurcharge, tierHighSurcharge)} 
                        className="h-8 text-sm dark:bg-ink-800 dark:border-ink-700 dark:text-white" 
                      />
                      <p className="text-[9px] text-ink-500 leading-tight mt-1">Si el plato cuesta menos que esto, no se le suma recargo.</p>
                    </div>
                    
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-medium text-ink-600 dark:text-ink-300">Límite de precio escalonado ($)</label>
                      <Input 
                        type="number" 
                        value={tierThreshold || ''} 
                        onChange={(e) => setTierSettings(tierMinPrice, Number(e.target.value), tierLowSurcharge, tierHighSurcharge)} 
                        className="h-8 text-sm dark:bg-ink-800 dark:border-ink-700 dark:text-white" 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-ink-600 dark:text-ink-300">Recargo ≤ Límite ($)</label>
                      <Input 
                        type="number" 
                        value={tierLowSurcharge || ''} 
                        onChange={(e) => setTierSettings(tierMinPrice, tierThreshold, Number(e.target.value), tierHighSurcharge)} 
                        className="h-8 text-sm dark:bg-ink-800 dark:border-ink-700 dark:text-white" 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-ink-600 dark:text-ink-300">Recargo {'>'} Límite ($)</label>
                      <Input 
                        type="number" 
                        value={tierHighSurcharge || ''} 
                        onChange={(e) => setTierSettings(tierMinPrice, tierThreshold, tierLowSurcharge, Number(e.target.value))} 
                        className="h-8 text-sm dark:bg-ink-800 dark:border-ink-700 dark:text-white" 
                      />
                    </div>
                  </div>
                )}
                
              </div>
            )}
          </div>

          {/* Modo de descuento por defecto */}
          <div className="space-y-2 pt-4 border-t border-ink-100 dark:border-ink-800">
            <label className="text-sm font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-2">
              <DollarSign size={16} className="text-blue-500" /> Modo de descuento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDefaultDiscountMode('percent')} className={cn('rounded-field border px-3 py-2 text-xs font-medium', defaultDiscountMode === 'percent' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-700' : 'border-ink-200 text-ink-600')}>Porcentaje</button>
              <button type="button" onClick={() => setDefaultDiscountMode('amount')} className={cn('rounded-field border px-3 py-2 text-xs font-medium', defaultDiscountMode === 'amount' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-700' : 'border-ink-200 text-ink-600')}>Monto fijo</button>
            </div>
          </div>

          {/* Ancho de papel */}
          <div className="space-y-2 pt-4 border-t border-ink-100 dark:border-ink-800">
            <label className="text-sm font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-2"><Printer size={16} className="text-sky-500" /> Ancho de impresora</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPaperWidth(58)} className={cn('rounded-field border px-3 py-2 text-xs font-medium', paperWidth === 58 ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-700' : 'border-ink-200 text-ink-600')}>58 mm</button>
              <button type="button" onClick={() => setPaperWidth(80)} className={cn('rounded-field border px-3 py-2 text-xs font-medium', paperWidth === 80 ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-700' : 'border-ink-200 text-ink-600')}>80 mm</button>
            </div>
          </div>

          {/* Redondeo */}
          <div className="space-y-2 pt-4 border-t border-ink-100 dark:border-ink-800">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div className="flex items-start gap-2">
                <Calculator size={16} className="text-violet-500 mt-0.5 shrink-0" />
                <span className="text-sm font-semibold text-ink-800 dark:text-ink-200">Redondear total final</span>
              </div>
              <button type="button" role="switch" aria-checked={roundingEnabled} onClick={() => setRoundingEnabled(!roundingEnabled)} className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent', roundingEnabled ? 'bg-violet-500' : 'bg-ink-300 dark:bg-ink-700')}>
                <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform', roundingEnabled ? 'translate-x-5' : 'translate-x-0')} />
              </button>
            </label>
          </div>

        </div>

        <div className="border-t border-ink-100 px-5 py-4 dark:border-ink-800 shrink-0 flex justify-between bg-white dark:bg-ink-900">
          <Button type="button" variant="ghost" onClick={handleReset}><RotateCcw size={16} className="mr-2" />Restaurar</Button>
          <Button type="button" onClick={() => { handleSaveCard(); handleSaveTransferPercent(); onClose(); }}>Listo</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}