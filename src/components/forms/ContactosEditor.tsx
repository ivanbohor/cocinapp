// src/components/forms/ContactosEditor.tsx
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ContactIcon,
  TIPOS_CONTACTO,
  type Contacto,
  type ContactType,
} from '@/components/icons/contact-icons';

interface ContactosEditorProps {
  contactos: Contacto[];
  onChange: (next: Contacto[]) => void;
  max?: number;
}

export function ContactosEditor({
  contactos,
  onChange,
  max = 8,
}: ContactosEditorProps) {
  const addContacto = () => {
    if (contactos.length >= max) return;
    const nuevo: Contacto = {
      id: crypto.randomUUID(),
      tipo: 'website',
      valor: '',
      label: '',
    };
    onChange([...contactos, nuevo]);
  };

  const updateContacto = (id: string, patch: Partial<Contacto>) => {
    onChange(contactos.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeContacto = (id: string) => {
    onChange(contactos.filter((c) => c.id !== id));
  };

  const mover = (index: number, dir: -1 | 1) => {
    const next = [...contactos];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {contactos.length === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          Todavía no agregaste ningún contacto. Podés sumar WhatsApp, redes,
          ubicación, apps de delivery y más.
        </p>
      )}

      {contactos.map((c, index) => (
        <div
          key={c.id}
          className="flex flex-col sm:flex-row gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
        >
          {/* Reordenar */}
          <div className="flex sm:flex-col gap-1 shrink-0 items-center">
            <button
              type="button"
              aria-label="Subir"
              onClick={() => mover(index, -1)}
              disabled={index === 0}
              className="text-slate-400 hover:text-slate-700 disabled:opacity-30 p-1"
            >
              <GripVertical size={14} />
            </button>
          </div>

          {/* Selector de tipo */}
          <select
            value={c.tipo}
            onChange={(e) => updateContacto(c.id, { tipo: e.target.value as ContactType })}
            className="h-11 rounded-field border border-slate-200 dark:border-slate-700 bg-transparent px-2 text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 sm:w-40 shrink-0"
          >
            {TIPOS_CONTACTO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Valor */}
          <div className="flex-1 relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <ContactIcon tipo={c.tipo} size={16} />
            </span>
            <Input
              value={c.valor}
              onChange={(e) => updateContacto(c.id, { valor: e.target.value })}
              placeholder={TIPOS_CONTACTO.find((t) => t.value === c.tipo)?.placeholder}
              className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          {/* Eliminar */}
          <button
            type="button"
            onClick={() => removeContacto(c.id)}
            aria-label="Eliminar contacto"
            className="h-11 w-11 shrink-0 grid place-items-center rounded-field text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addContacto}
        disabled={contactos.length >= max}
        className="w-full sm:w-auto"
      >
        <Plus size={14} className="mr-2" />
        Agregar contacto {contactos.length >= max && `(máx. ${max})`}
      </Button>
    </div>
  );
}