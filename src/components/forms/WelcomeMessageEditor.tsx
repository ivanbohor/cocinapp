// src/components/forms/WelcomeMessageEditor.tsx
import { useRef } from 'react';
import { Bold, Underline, CornerDownLeft } from 'lucide-react';

interface WelcomeMessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function WelcomeMessageEditor({
  value,
  onChange,
  maxLength = 280,
}: WelcomeMessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Aplica o quita formato (**negrita** o __subrayado__) sobre la selección actual.
   * Si no hay texto seleccionado, inserta un texto ejemplo preseleccionado para escribir encima.
   */
  const toggleFormat = (marker: '**' | '__', placeholderText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const markerLen = marker.length;

    // Caso 1: El texto seleccionado ya tiene los marcadores por fuera -> quitar formato
    const before = value.slice(Math.max(0, start - markerLen), start);
    const after = value.slice(end, end + markerLen);
    if (before === marker && after === marker) {
      const nextValue =
        value.slice(0, start - markerLen) +
        selected +
        value.slice(end + markerLen);
      onChange(nextValue);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start - markerLen, end - markerLen);
      });
      return;
    }

    // Caso 2: Hay texto seleccionado -> envolver con marcadores
    if (selected.length > 0) {
      const nextValue =
        value.slice(0, start) + marker + selected + marker + value.slice(end);
      onChange(nextValue.slice(0, maxLength));

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + markerLen, end + markerLen);
      });
      return;
    }

    // Caso 3: Cursor sin selección -> insertar plantilla resaltada lista para tipear
    const insertion = `${marker}${placeholderText}${marker}`;
    const nextValue = (
      value.slice(0, start) +
      insertion +
      value.slice(end)
    ).slice(0, maxLength);
    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const selStart = Math.min(start + markerLen, nextValue.length);
      const selEnd = Math.min(
        start + markerLen + placeholderText.length,
        nextValue.length
      );
      textarea.setSelectionRange(selStart, selEnd);
    });
  };

  /**
   * Inserta un salto de línea en la posición actual del cursor.
   */
  const insertLineBreak = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = (
      value.slice(0, start) +
      '\n' +
      value.slice(end)
    ).slice(0, maxLength);
    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const nextPos = Math.min(start + 1, nextValue.length);
      textarea.setSelectionRange(nextPos, nextPos);
    });
  };

  /**
   * Agrega una línea sugerida al final del mensaje (ej. horarios o llamado a redes).
   */
  const appendPresetLine = (snippet: string) => {
    const trimmed = value.trimEnd();
    const separator = trimmed.length > 0 ? '\n' : '';
    const nextValue = `${trimmed}${separator}${snippet}`.slice(0, maxLength);
    onChange(nextValue);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(nextValue.length, nextValue.length);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      toggleFormat('**', 'negrita');
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      toggleFormat('__', 'subrayado');
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition-all">
      {/* Barra de herramientas superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-900/70">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleFormat('**', 'texto en negrita')}
            title="Negrita (Ctrl + B)"
            aria-label="Aplicar negrita"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            <Bold size={13} strokeWidth={2.75} />
            <span className="hidden sm:inline">Negrita</span>
          </button>

          <button
            type="button"
            onClick={() => toggleFormat('__', 'texto subrayado')}
            title="Subrayado (Ctrl + U)"
            aria-label="Aplicar subrayado"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            <Underline size={13} strokeWidth={2.5} />
            <span className="hidden sm:inline">Subrayado</span>
          </button>

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

          <button
            type="button"
            onClick={insertLineBreak}
            title="Insertar salto de línea (Enter)"
            aria-label="Insertar salto de línea"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            <CornerDownLeft size={13} />
            <span>Salto de línea</span>
          </button>
        </div>

        <span
          className={`text-[11px] font-mono ${
            value.length >= maxLength - 20
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-400'
          }`}
        >
          {value.length}/{maxLength}
        </span>
      </div>

      {/* Área de texto multilínea */}
      <textarea
        ref={textareaRef}
        rows={3}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={'Ej: **Precios en Efectivo.** Tarjeta 10% adicional.\nHorarios: Lun a Sáb 12 a 23 hs\n__Encontranos también en:__'}
        className="w-full resize-y px-3 py-2.5 text-sm bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400/80 outline-none leading-relaxed"
      />

      {/* Pie con atajos rápidos para locales */}
      <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
          Insertar rápido:
        </span>
        <button
          type="button"
          onClick={() => appendPresetLine('**Horarios:** Lun a Sáb 12:00 a 23:30 hs')}
          className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
        >
          + Horarios
        </button>
        <button
          type="button"
          onClick={() => appendPresetLine('__Encontranos también en:__')}
          className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
        >
          + Encontranos en
        </button>
      </div>
    </div>
  );
}