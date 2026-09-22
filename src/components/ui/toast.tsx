// src/components/ui/toast.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useToastStore, type Toast, type ToastVariant } from '@/stores/useToastStore';
import { cn } from '@/lib/utils';

const toastVariants = cva(
  'pointer-events-auto relative flex w-full items-start gap-3 rounded-field border p-4 shadow-lg ' +
    'transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        success:
          'border-emerald-200 bg-white text-ink-900 ' +
          'dark:border-emerald-900/50 dark:bg-ink-900 dark:text-ink-100',
        error:
          'border-red-200 bg-white text-ink-900 ' +
          'dark:border-red-900/50 dark:bg-ink-900 dark:text-ink-100',
        warning:
          'border-amber-200 bg-white text-ink-900 ' +
          'dark:border-amber-900/50 dark:bg-ink-900 dark:text-ink-100',
        info:
          'border-ink-200 bg-white text-ink-900 ' +
          'dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100',
      },
    },
    defaultVariants: { variant: 'info' },
  }
);

const ICON_MAP: Record<ToastVariant, { Icon: LucideIcon; className: string }> = {
  success: { Icon: CheckCircle2, className: 'text-emerald-600 dark:text-emerald-400' },
  error: { Icon: AlertCircle, className: 'text-red-600 dark:text-red-400' },
  warning: { Icon: AlertCircle, className: 'text-amber-600 dark:text-amber-400' },
  info: { Icon: Info, className: 'text-brand-600 dark:text-brand-400' },
};

interface ToastItemProps extends VariantProps<typeof toastVariants> {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast: t, onDismiss }: ToastItemProps) {
  const { Icon, className: iconClass } = ICON_MAP[t.variant];
  const role = t.variant === 'error' ? 'alert' : 'status';
  const ariaLive = t.variant === 'error' ? 'assertive' : 'polite';

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={cn(toastVariants({ variant: t.variant }), 'animate-in slide-in-from-right-4 fade-in')}
    >
      <Icon size={20} className={cn('mt-0.5 shrink-0', iconClass)} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{t.title}</p>
        {t.description && (
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">{t.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        aria-label="Cerrar notificación"
        className="-m-1 rounded p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700
                   dark:hover:bg-ink-800 dark:hover:text-ink-200
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notificaciones"
      className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3
                 sm:top-6 sm:right-6"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}