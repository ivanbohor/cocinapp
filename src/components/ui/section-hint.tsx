// src/components/ui/section-hint.tsx
import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHintProps {
  /** Texto conciso que explica la función clave de la sección para el comerciante */
  text: string;
  /** Título opcional del tooltip (por defecto: '¿Cómo funciona esta sección?') */
  title?: string;
  /** Alineación horizontal del menú desplegable */
  align?: 'left' | 'right';
  className?: string;
}

export function SectionHint({
  text,
  title = '¿Cómo funciona esta sección?',
  align = 'left',
  className,
}: SectionHintProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Ayuda contextual de la sección"
        aria-expanded={isOpen}
        title="Ayuda sobre esta sección"
        className={cn(
          'p-1 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
          isOpen
            ? 'bg-brand-500 text-white shadow-sm'
            : 'text-ink-400 hover:text-brand-500 dark:text-ink-500 dark:hover:text-brand-400 hover:bg-ink-100 dark:hover:bg-ink-800'
        )}
      >
        <HelpCircle size={18} className="shrink-0" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={cn(
            'absolute top-full mt-2 z-50 w-72 sm:w-80 rounded-xl p-4 shadow-xl border backdrop-blur-md animate-in fade-in zoom-in-95 duration-150',
            'bg-white/95 text-ink-900 border-ink-200 dark:bg-ink-900/95 dark:text-ink-100 dark:border-ink-700',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-ink-100 dark:border-ink-800">
            <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400">
              <span aria-hidden="true">💡</span>
              <h4>{title}</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-ink-400 hover:text-ink-700 dark:text-ink-500 dark:hover:text-ink-200 p-0.5 rounded transition"
              aria-label="Cerrar ayuda"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300 font-normal">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
export default SectionHint;
