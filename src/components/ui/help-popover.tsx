// src/components/ui/help-popover.tsx
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpPopoverProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** Alineación horizontal del popover respecto al trigger */
  align?: 'start' | 'end';
}

export function HelpPopover({
  children,
  className,
  ariaLabel = 'Más información',
  align = 'start',
}: HelpPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);

  // Calcular posición del popover al abrir
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 320; // coincide con w-80
    const viewportWidth = window.innerWidth;
    const margin = 16;

    let left = align === 'end' ? rect.right - popoverWidth : rect.left;

    // Evitar que se salga de la pantalla
    if (left + popoverWidth > viewportWidth - margin) {
      left = viewportWidth - popoverWidth - margin;
    }
    if (left < margin) left = margin;

    setPosition({
      top: rect.bottom + 8,
      left,
    });
  }, [isOpen, align]);

  // Cerrar con click afuera o Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors',
          'text-ink-400 hover:bg-ink-100 hover:text-ink-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2',
          'dark:hover:bg-ink-800 dark:hover:text-ink-200',
          isOpen && 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
          className
        )}
      >
        <HelpCircle size={16} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 100,
            }}
            className="w-80 max-w-[calc(100vw-2rem)] rounded-card border border-ink-200 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 dark:border-ink-800 dark:bg-ink-900"
          >
            {children}
          </div>,
          document.body
        )}
    </>
  );
}