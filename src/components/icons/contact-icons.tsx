// src/components/icons/contact-icons.tsx
import type { SVGProps } from 'react';
import { MapPin, Globe, Phone, Mail, Bike, ShoppingBag, Wallet } from 'lucide-react';
import { InstagramIcon } from './InstagramIcon';

export type ContactType =
  | 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'x'
  | 'maps' | 'rappi' | 'pedidosya' | 'mercadopago'
  | 'website' | 'phone' | 'email';

export interface Contacto {
  id: string;
  tipo: ContactType;
  valor: string;
  label?: string;
}

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number;
}

/* ── Brand icons (solid fill) ─────────────────────────── */
export function WhatsAppIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export function FacebookIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export function TikTokIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

export function XIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
    </svg>
  );
}

/* ── Dispatcher: devuelve el ícono según el tipo ──────── */
export function ContactIcon({ tipo, size = 16 }: { tipo: ContactType; size?: number }) {
  switch (tipo) {
    case 'whatsapp':    return <WhatsAppIcon size={size} />;
    case 'instagram':   return <InstagramIcon size={size} />;
    case 'facebook':    return <FacebookIcon size={size} />;
    case 'tiktok':      return <TikTokIcon size={size} />;
    case 'x':           return <XIcon size={size} />;
    case 'maps':        return <MapPin size={size} />;
    case 'rappi':       return <ShoppingBag size={size} />;
    case 'pedidosya':   return <Bike size={size} />;
    case 'mercadopago': return <Wallet size={size} />;
    case 'website':     return <Globe size={size} />;
    case 'phone':       return <Phone size={size} />;
    case 'email':       return <Mail size={size} />;
    default:            return <Globe size={size} />;
  }
}

/* ── Catálogo de tipos disponibles para el editor ─────── */
export const TIPOS_CONTACTO: { value: ContactType; label: string; placeholder: string }[] = [
  { value: 'whatsapp',    label: 'WhatsApp',           placeholder: '+54 9 11 1234-5678' },
  { value: 'instagram',   label: 'Instagram',          placeholder: '@turestaurante' },
  { value: 'facebook',    label: 'Facebook',           placeholder: 'https://facebook.com/tu-pagina' },
  { value: 'tiktok',      label: 'TikTok',             placeholder: '@turestaurante' },
  { value: 'x',           label: 'X (Twitter)',        placeholder: '@turestaurante' },
  { value: 'maps',        label: 'Ubicación (Maps)',   placeholder: 'https://maps.google.com/...' },
  { value: 'rappi',       label: 'Rappi',              placeholder: 'https://rappi.com/...' },
  { value: 'pedidosya',   label: 'PedidosYa',          placeholder: 'https://pedidosya.com/...' },
  { value: 'mercadopago', label: 'MercadoPago',        placeholder: 'https://link.mercadopago.com.ar/...' },
  { value: 'website',     label: 'Sitio web',          placeholder: 'https://turestaurante.com' },
  { value: 'phone',       label: 'Teléfono',           placeholder: '+54 11 1234-5678' },
  { value: 'email',       label: 'Email',              placeholder: 'contacto@turestaurante.com' },
];

/* ── Colores de marca por tipo (para botones circulares) ─ */
export const CONTACT_COLORS: Record<ContactType, string> = {
  whatsapp:    '#25D366',
  instagram:   '#E4405F',
  facebook:    '#1877F2',
  tiktok:      '#000000',
  x:           '#000000',
  maps:        '#4285F4',
  rappi:       '#FF441F',
  pedidosya:   '#FA0050',
  mercadopago: '#00B1EA',
  website:     '#64748b',
  phone:       '#10b981',
  email:       '#f59e0b',
};

/* ── Etiquetas amigables para los tooltips ───────────── */
export const CONTACT_LABELS: Record<ContactType, string> = {
  whatsapp:    'Escribinos por WhatsApp',
  instagram:   'Seguinos en Instagram',
  facebook:    'Visitanos en Facebook',
  tiktok:      'Seguinos en TikTok',
  x:           'Seguinos en X',
  maps:        'Ver ubicación en Maps',
  rappi:       'Pedir por Rappi',
  pedidosya:   'Pedir por PedidosYa',
  mercadopago: 'Pagar con MercadoPago',
  website:     'Sitio web',
  phone:       'Llamar',
  email:       'Enviar email',
};

/* ── Etiquetas cortas para píldoras ──────────────────── */
export const CONTACT_SHORT_LABELS: Record<ContactType, string> = {
  whatsapp:    'WhatsApp',
  instagram:   'Instagram',
  facebook:    'Facebook',
  tiktok:      'TikTok',
  x:           'X',
  maps:        'Ubicación',
  rappi:       'Rappi',
  pedidosya:   'PedidosYa',
  mercadopago: 'MercadoPago',
  website:     'Sitio web',
  phone:       'Llamar',
  email:       'Email',
};

/* ── Helper: URL final del contacto ───────────────────── */
export function buildContactUrl(tipo: ContactType, valor: string): string {
  const v = valor.trim();
  if (/^https?:\/\//i.test(v)) return v;
  switch (tipo) {
    case 'whatsapp':  return `https://wa.me/${v.replace(/[^0-9]/g, '')}`;
    case 'instagram': return `https://instagram.com/${v.replace(/^@/, '')}`;
    case 'facebook':  return `https://facebook.com/${v.replace(/^@/, '')}`;
    case 'tiktok':    return `https://tiktok.com/@${v.replace(/^@/, '')}`;
    case 'x':         return `https://x.com/${v.replace(/^@/, '')}`;
    case 'phone':     return `tel:${v.replace(/[^0-9+]/g, '')}`;
    case 'email':     return `mailto:${v}`;
    default:          return v;
  }
}