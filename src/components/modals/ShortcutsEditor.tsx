// src/components/modals/ShortcutsEditor.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface SeccionShortcut {
  id: string;
  label: string;
  descripcion: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

interface ShortcutsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  secciones: SeccionShortcut[];
  activeIds: string[];
  max: number;
  onSave: (ids: string[]) => void;
  isSaving: boolean;
}

export function ShortcutsEditor({
  isOpen,
  onClose,
  secciones,
  activeIds,
  max,
  onSave,
  isSaving,
}: ShortcutsEditorProps) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setSelected(activeIds);
  }, [isOpen, activeIds]);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < max
          ? [...prev, id]
          : prev
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm animate-in fade-in"
      />

      <div className="relative z-10 w-full max-w-lg rounded-card border border-ink-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in dark:border-ink-800 dark:bg-ink-900 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800 shrink-0">
          <div>
            <h2 id="shortcuts-modal-title" className="text-base font-semibold text-ink-900 dark:text-ink-100">
              Personalizar inicio
            </h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
              Elegí las secciones que querés ver como atajos. Máximo {max}.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="-m-1 rounded p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin space-y-1">
          {secciones.map((s) => {
            const Icon = s.icon;
            const isSelected = selected.includes(s.id);
            const isDisabled = !isSelected && selected.length >= max;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                disabled={isDisabled}
                className={cn(
                  'w-full flex items-center gap-3 rounded-field border p-3 text-left transition-colors',
                  isSelected
                    ? 'border-brand-300 bg-brand-50/60 dark:bg-brand-950/20 dark:border-brand-800'
                    : isDisabled
                      ? 'border-ink-200 dark:border-ink-800 opacity-40 cursor-not-allowed'
                      : 'border-ink-200 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-800/50'
                )}
              >
                <div className={cn('grid h-10 w-10 place-items-center rounded-lg shrink-0', s.bgClass, s.colorClass)}>
                  <Icon size={18} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                    {s.label}
                  </p>
                  <p className="text-xs text-ink-500 dark:text-ink-400 truncate">
                    {s.descripcion}
                  </p>
                </div>
                <div className={cn(
                  'grid h-6 w-6 place-items-center rounded-full border-2 shrink-0 transition-colors',
                  isSelected
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-ink-300 dark:border-ink-600'
                )}>
                  {isSelected && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-ink-100 px-5 py-4 dark:border-ink-800 shrink-0 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => onSave(selected)}
            disabled={isSaving || selected.length === 0}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar atajos'
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}