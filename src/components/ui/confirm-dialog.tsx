// src/components/ui/confirm-dialog.tsx
import * as React from 'react';
import { create } from 'zustand';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  resolver: ((value: boolean) => void) | null;
  open: (options: ConfirmOptions) => Promise<boolean>;
  close: (value: boolean) => void;
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,
  resolver: null,

  open: (options) =>
    new Promise<boolean>((resolve) => {
      set({ isOpen: true, options, resolver: resolve });
    }),

  close: (value) => {
    const resolver = get().resolver;
    set({ isOpen: false, options: null, resolver: null });
    resolver?.(value);
  },
}));

/* API pública — función imperativa que devuelve una Promise<boolean> */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().open(options);
}

export function ConfirmDialogHost() {
  const { isOpen, options, close } = useConfirmStore();

  // Cerrar con Escape
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Bloquear scroll del body mientras está abierto
  React.useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen || !options) return null;

  const {
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    destructive = false,
  } = options;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={() => close(false)}
        className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm animate-in fade-in"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-card border bg-white p-6 shadow-2xl ' +
            'animate-in zoom-in-95 fade-in ' +
            'dark:border-ink-800 dark:bg-ink-900',
          'border-ink-200'
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-full',
              destructive
                ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                : 'bg-brand-100 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400'
            )}
          >
            <AlertTriangle size={22} aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id="confirm-title"
              className="text-base font-semibold text-ink-900 dark:text-ink-100"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => close(false)}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={() => close(true)}
            autoFocus
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}