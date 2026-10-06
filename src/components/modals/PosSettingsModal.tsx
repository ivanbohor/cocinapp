// src/components/modals/PosSettingsModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings2, RotateCcw, Percent, CreditCard, DollarSign, Printer, Calculator } from 'lucide-react';
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
  cardSurcharge,
  defaultDiscountMode,
  paperWidth,
  roundingEnabled,
  setCardSurcharge,
  setDefaultDiscountMode,
  setPaperWidth,
  setRoundingEnabled,
  resetToDefaults,
} = usePosSettingsStore();
  

  const [surchargeInput, setSurchargeInput] = useState(cardSurcharge.toString());

  useEffect(() => {
    if (isOpen) setSurchargeInput(cardSurcharge.toString());
  }, [isOpen, cardSurcharge]);

  // Bloquear scroll del body
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleGuardarSurcharge = () => {
    const num = parseFloat(surchargeInput);
    if (!isNaN(num) && num >= 0 && num <= 50) {
      setCardSurcharge(num);
    } else {
      setSurchargeInput(cardSurcharge.toString());
    }
  };

  const handleReset = () => {
    resetToDefaults();
    setSurchargeInput('10');
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pos-settings-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm animate-in fade-in"
      />

      <div className="relative z-10 w-full max-w-md rounded-card border border-ink-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in dark:border-ink-800 dark:bg-ink-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800 shrink-0">
          <div>
            <h2
              id="pos-settings-title"
              className="text-base font-semibold text-ink-900 dark:text-ink-100 flex items-center gap-2"
            >
              <Settings2 size={18} className="text-brand-500" />
              Ajustes del POS
            </h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
              Configuración local de esta caja. Se guarda en tu dispositivo.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="-m-1 rounded p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:hover:bg-ink-800 dark:hover:text-ink-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {/* Recargo por tarjeta */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-2">
              <CreditCard size={16} className="text-brand-500" />
              Recargo por pago con tarjeta
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={surchargeInput}
                  onChange={(e) => setSurchargeInput(e.target.value)}
                  onBlur={handleGuardarSurcharge}
                  className="pr-10 dark:bg-ink-800 dark:border-ink-700 dark:text-white"
                />
                <Percent
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
                />
              </div>
            </div>
            <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
              Se aplica sobre el subtotal al elegir <strong>Tarjeta</strong>. Valor actual:{' '}
              <strong className="text-brand-600 dark:text-brand-400">{cardSurcharge}%</strong>
            </p>
          </div>

          {/* Modo de descuento por defecto */}
          <div className="space-y-2 pt-4 border-t border-ink-100 dark:border-ink-800">
            <label className="text-sm font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-500" />
              Modo de descuento por defecto
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDefaultDiscountMode('percent')}
                className={cn(
                  'rounded-field border px-3 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-1',
                  defaultDiscountMode === 'percent'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-700'
                    : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
                )}
              >
                <Percent size={18} />
                <span>Porcentaje</span>
                <span className="text-[10px] opacity-70">Ej: 10%</span>
              </button>
              <button
                type="button"
                onClick={() => setDefaultDiscountMode('amount')}
                className={cn(
                  'rounded-field border px-3 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-1',
                  defaultDiscountMode === 'amount'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-700'
                    : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
                )}
              >
                <DollarSign size={18} />
                <span>Monto fijo</span>
                <span className="text-[10px] opacity-70">Ej: $2.000</span>
              </button>
            </div>
            <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
              El modo se puede cambiar en cada venta con el botón <strong>%/AR$</strong> al lado del campo.
            </p>
          </div>
          {/* Ancho de papel */}
                <div className="space-y-2 pt-4 border-t border-ink-100 dark:border-ink-800">
                <label className="text-sm font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-2">
                    <Printer size={16} className="text-sky-500" />
                    Ancho del papel de la impresora
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                    type="button"
                    onClick={() => setPaperWidth(58)}
                    className={cn(
                        'rounded-field border px-3 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-1',
                        paperWidth === 58
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-700'
                        : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
                    )}
                    >
                    <span className="font-bold">58 mm</span>
                    <span className="text-[10px] opacity-70">Comanderas chicas</span>
                    </button>
                    <button
                    type="button"
                    onClick={() => setPaperWidth(80)}
                    className={cn(
                        'rounded-field border px-3 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-1',
                        paperWidth === 80
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-700'
                        : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
                    )}
                    >
                    <span className="font-bold">80 mm</span>
                    <span className="text-[10px] opacity-70">Comanderas grandes</span>
                    </button>
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
                    Si el ticket se imprime cortado a la derecha, cambiá al ancho correcto. La mayoría de las comanderas chicas son 58mm.
                </p>
                </div>
        </div>

        {/* Redondeo de importes */}
                <div className="space-y-2 pt-4 border-t border-ink-100 dark:border-ink-800">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div className="flex items-start gap-2">
                    <Calculator size={16} className="text-violet-500 mt-0.5 shrink-0" />
                    <div>
                        <span className="text-sm font-semibold text-ink-800 dark:text-ink-200 block">
                        Redondear total final
                        </span>
                        <span className="text-xs text-ink-500 dark:text-ink-400 block mt-0.5 leading-relaxed">
                        Ajusta el monto a múltiplos de 50 o 100 para evitar vueltos con centavos.
                        </span>
                    </div>
                    </div>
                    <button
                    type="button"
                    role="switch"
                    aria-checked={roundingEnabled}
                    onClick={() => setRoundingEnabled(!roundingEnabled)}
                    className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                        roundingEnabled ? 'bg-violet-500' : 'bg-ink-300 dark:bg-ink-700'
                    )}
                    >
                    <span
                        className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
                        roundingEnabled ? 'translate-x-5' : 'translate-x-0'
                        )}
                    />
                    </button>
                </label>
                {roundingEnabled && (
                    <p className="text-[11px] text-ink-500 dark:text-ink-400 bg-ink-50 dark:bg-ink-950/40 p-2 rounded leading-relaxed">
                    Ejemplo: <strong>$12.675</strong> → <strong>$12.700</strong> · <strong>$12.620</strong> → <strong>$12.650</strong>
                    </p>
                )}
                </div>



        {/* Footer */}
        <div className="border-t border-ink-100 px-5 py-4 dark:border-ink-800 shrink-0 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="w-full sm:w-auto text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
          >
            <RotateCcw size={16} className="mr-2" />
            Restaurar valores
          </Button>
          <Button
            type="button"
            onClick={() => {
              handleGuardarSurcharge();
              onClose();
            }}
            className="w-full sm:w-auto"
          >
            Listo
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}