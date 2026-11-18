// src/components/forms/ContactosEditor.tsx
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ContactIcon,
  CONTACT_PLATFORMS,
  CONTACT_BADGE_BG,
  type Contacto,
} from '@/components/icons/contact-icons';

interface ContactosEditorProps {
  contactos: Contacto[];
  onChange: (contactos: Contacto[]) => void;
}

function normalizeTipo(tipo: string): string {
  const lower = tipo.toLowerCase();
  if (
    lower === 'mercadopago' ||
    lower === 'mercadopago_delivery' ||
    lower === 'mercadopagodelivery' ||
    lower === 'mp'
  ) {
    return 'mercadodelivery';
  }
  if (lower === 'x') return 'twitter';
  return lower;
}

export function ContactosEditor({ contactos, onChange }: ContactosEditorProps) {
  const handleAdd = (tipoDefault?: string) => {
    const usedTypes = new Set(contactos.map((c) => normalizeTipo(c.tipo)));
    const nextPlatform =
      tipoDefault ||
      CONTACT_PLATFORMS.find((p) => !usedTypes.has(p.tipo))?.tipo ||
      'whatsapp';

    onChange([
      ...contactos,
      {
        id: crypto.randomUUID(),
        tipo: nextPlatform,
        valor: '',
        label: '',
      },
    ]);
  };

  const handleUpdate = (id: string, field: keyof Contacto, value: string) => {
    onChange(
      contactos.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemove = (id: string) => {
    onChange(contactos.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Agregá tus canales de contacto, redes sociales o plataformas de delivery. Aparecerán con su logotipo oficial en la cabecera de tu carta.
      </p>

      {/* Accesos rápidos para agregar plataformas con 1 clic */}
      <div className="flex flex-wrap gap-1.5">
        {CONTACT_PLATFORMS.map((platform) => {
          const alreadyAdded = contactos.some(
            (c) => normalizeTipo(c.tipo) === platform.tipo
          );
          return (
            <button
              key={platform.tipo}
              type="button"
              onClick={() => handleAdd(platform.tipo)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                alreadyAdded
                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white shrink-0 shadow-2xs"
                style={{ background: platform.badgeBg }}
              >
                <ContactIcon tipo={platform.tipo} size={11} />
              </span>
              <span>+ {platform.label}</span>
            </button>
          );
        })}
      </div>

      {/* Lista de canales configurados */}
      {contactos.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {contactos.map((contacto) => {
            const normalized = normalizeTipo(contacto.tipo);
            const currentPlatform = CONTACT_PLATFORMS.find(
              (p) => p.tipo === normalized
            );
            const badgeBg = CONTACT_BADGE_BG[normalized] || '#475569';

            return (
              <div
                key={contacto.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <div className="flex items-center gap-2 sm:w-52 shrink-0">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white shadow-xs shrink-0 ring-1 ring-black/10"
                    style={{ background: badgeBg }}
                  >
                    <ContactIcon tipo={normalized} size={17} />
                  </span>

                  <select
                    value={normalized}
                    onChange={(e) => handleUpdate(contacto.id, 'tipo', e.target.value)}
                    aria-label="Seleccionar red o aplicación"
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-semibold text-slate-800 dark:text-white outline-none"
                  >
                    {CONTACT_PLATFORMS.map((opt) => (
                      <option key={opt.tipo} value={opt.tipo}>
                        {opt.label}
                      </option>
                    ))}
                    {!currentPlatform && (
                      <option value={contacto.tipo}>{contacto.tipo}</option>
                    )}
                  </select>
                </div>

                <div className="flex-1">
                  <Input
                    value={contacto.valor}
                    onChange={(e) => handleUpdate(contacto.id, 'valor', e.target.value)}
                    placeholder={currentPlatform?.placeholder || 'Usuario, teléfono o enlace...'}
                    className="h-9 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <div className="sm:w-36">
                  <Input
                    value={contacto.label || ''}
                    onChange={(e) => handleUpdate(contacto.id, 'label', e.target.value)}
                    placeholder="Etiqueta (opc.)"
                    className="h-9 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(contacto.id)}
                  aria-label="Eliminar contacto"
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition shrink-0 self-end sm:self-center"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() => handleAdd()}
        className="w-full sm:w-auto text-xs flex items-center justify-center gap-1.5 dark:border-slate-700 dark:text-slate-300"
      >
        <Plus size={14} /> Agregar otro canal
      </Button>
    </div>
  );
}

export default ContactosEditor;