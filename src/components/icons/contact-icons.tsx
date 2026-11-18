// src/components/icons/contact-icons.tsx
export type ContactTipo =
  | 'whatsapp'
  | 'instagram'
  | 'rappi'
  | 'pedidosya'
  | 'mercadodelivery'
  | 'mercadopago'
  | 'maps'
  | 'tiktok'
  | 'facebook'
  | 'twitter'
  | 'telefono'
  | 'web';

export interface Contacto {
  id: string;
  tipo: ContactTipo | string;
  valor: string;
  label?: string;
}

export interface ContactPlatformOption {
  tipo: ContactTipo;
  label: string;
  shortLabel: string;
  placeholder: string;
  brandColor: string;
  badgeBg: string;
}

/**
 * Catálogo maestro de plataformas disponibles por defecto en CocinApp.
 */
export const CONTACT_PLATFORMS: ContactPlatformOption[] = [
  {
    tipo: 'whatsapp',
    label: 'WhatsApp',
    shortLabel: 'WhatsApp',
    placeholder: 'Ej: 11 7502-2186',
    brandColor: '#25D366',
    badgeBg: '#25D366',
  },
  {
    tipo: 'instagram',
    label: 'Instagram',
    shortLabel: 'Instagram',
    placeholder: 'Ej: @barespaniol',
    brandColor: '#E4405F',
    badgeBg:
      'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
  },
  {
    tipo: 'rappi',
    label: 'Rappi',
    shortLabel: 'Rappi',
    placeholder: 'https://www.rappi.com.ar/restaurantes/...',
    brandColor: '#FF441F',
    badgeBg: '#FF441F',
  },
  {
    tipo: 'pedidosya',
    label: 'PedidosYa',
    shortLabel: 'PedidosYa',
    placeholder: 'https://www.pedidosya.com.ar/restaurantes/...',
    brandColor: '#FA0050',
    badgeBg: '#FA0050',
  },
  {
    tipo: 'mercadodelivery',
    label: 'Mercado Pago Delivery',
    shortLabel: 'MP Delivery',
    placeholder: 'https://delivery.mercadopago.com.ar/...',
    brandColor: '#009EE3',
    badgeBg: '#009EE3',
  },
  {
    tipo: 'maps',
    label: 'Google Maps',
    shortLabel: 'Maps',
    placeholder: 'https://maps.app.goo.gl/... o dirección',
    brandColor: '#34A853',
    badgeBg: '#FFFFFF',
  },
  {
    tipo: 'tiktok',
    label: 'TikTok',
    shortLabel: 'TikTok',
    placeholder: 'Ej: @barespaniol',
    brandColor: '#000000',
    badgeBg: '#000000',
  },
  {
    tipo: 'facebook',
    label: 'Facebook',
    shortLabel: 'Facebook',
    placeholder: 'Ej: barespaniol',
    brandColor: '#0866FF',
    badgeBg: '#0866FF',
  },
  {
    tipo: 'twitter',
    label: 'X (Twitter)',
    shortLabel: 'X',
    placeholder: 'Ej: @barespaniol',
    brandColor: '#000000',
    badgeBg: '#000000',
  },
];

export const CONTACT_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  instagram: '#E4405F',
  rappi: '#FF441F',
  pedidosya: '#FA0050',
  mercadodelivery: '#009EE3',
  mercadopago: '#009EE3',
  mercadopago_delivery: '#009EE3',
  mercadopagodelivery: '#009EE3',
  mp: '#009EE3',
  maps: '#34A853',
  tiktok: '#000000',
  facebook: '#0866FF',
  twitter: '#000000',
  x: '#000000',
  telefono: '#0EA5E9',
  web: '#6366F1',
};

export const CONTACT_BADGE_BG: Record<string, string> = {
  whatsapp: '#25D366',
  instagram:
    'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
  rappi: '#FF441F',
  pedidosya: '#FA0050',
  mercadodelivery: '#009EE3',
  mercadopago: '#009EE3',
  mercadopago_delivery: '#009EE3',
  mercadopagodelivery: '#009EE3',
  mp: '#009EE3',
  maps: '#FFFFFF',
  tiktok: '#000000',
  facebook: '#0866FF',
  twitter: '#000000',
  x: '#000000',
  telefono: '#0EA5E9',
  web: '#6366F1',
};

export const CONTACT_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  rappi: 'Pedir por Rappi',
  pedidosya: 'Pedir por PedidosYa',
  mercadodelivery: 'Pedir por Mercado Pago Delivery',
  mercadopago: 'Pedir por Mercado Pago Delivery',
  mercadopago_delivery: 'Pedir por Mercado Pago Delivery',
  mercadopagodelivery: 'Pedir por Mercado Pago Delivery',
  mp: 'Pedir por Mercado Pago Delivery',
  maps: 'Cómo llegar (Google Maps)',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  twitter: 'X (Twitter)',
  x: 'X (Twitter)',
  telefono: 'Llamar por teléfono',
  web: 'Sitio web',
};

export const CONTACT_SHORT_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  rappi: 'Rappi',
  pedidosya: 'PedidosYa',
  mercadodelivery: 'MP Delivery',
  mercadopago: 'MP Delivery',
  mercadopago_delivery: 'MP Delivery',
  mercadopagodelivery: 'MP Delivery',
  mp: 'MP Delivery',
  maps: 'Maps',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  twitter: 'X',
  x: 'X',
  telefono: 'Teléfono',
  web: 'Web',
};

/**
 * Normaliza usuarios, teléfonos o URLs ingresadas por el dueño del local
 * hacia enlaces navegables válidos.
 */
export function buildContactUrl(tipo: string, valor: string): string {
  const clean = valor.trim();
  if (!clean) return '#';

  const normalizedType = tipo.toLowerCase();

  if (normalizedType === 'whatsapp') {
    if (/^https?:\/\//i.test(clean)) return clean;
    const digits = clean.replace(/\D/g, '');
    const fullNumber = digits.length === 10 ? `549${digits}` : digits;
    return `https://wa.me/${fullNumber}`;
  }

  if (normalizedType === 'telefono') {
    return `tel:${clean.replace(/[^\d+]/g, '')}`;
  }

  if (normalizedType === 'instagram') {
    if (/^https?:\/\//i.test(clean)) return clean;
    return `https://www.instagram.com/${clean.replace(/^@/, '')}`;
  }

  if (normalizedType === 'tiktok') {
    if (/^https?:\/\//i.test(clean)) return clean;
    const handle = clean.startsWith('@') ? clean : `@${clean}`;
    return `https://www.tiktok.com/${handle}`;
  }

  if (normalizedType === 'facebook') {
    if (/^https?:\/\//i.test(clean)) return clean;
    return `https://www.facebook.com/${clean.replace(/^@/, '')}`;
  }

  if (normalizedType === 'twitter' || normalizedType === 'x') {
    if (/^https?:\/\//i.test(clean)) return clean;
    return `https://x.com/${clean.replace(/^@/, '')}`;
  }

  if (normalizedType === 'maps') {
    if (/^https?:\/\//i.test(clean)) return clean;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean)}`;
  }

  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://${clean}`;
}

interface ContactIconProps {
  tipo: string;
  size?: number;
  className?: string;
}

/**
 * Renderiza el logotipo vectorial SVG optimizado de cada plataforma.
 */
export function ContactIcon({ tipo, size = 18, className = '' }: ContactIconProps) {
  switch (tipo.toLowerCase()) {
    case 'whatsapp':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.96 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.61-2.91-1.25-4.81-4.19-4.96-4.38-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.01-2.42.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.02.9 2.17.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.14.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.66-.14.27.1 1.7.8 1.99.95.29.14.48.22.55.34.07.12.07.69-.17 1.37z" />
        </svg>
      );

    case 'rappi':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 10.6c-1.45 0-2.35 1.15-3.85 1.15-1.15 0-1.95-.72-2.25-1.55-.25-.68-.98-.88-1.52-.43-.62.52-.78 1.48-.35 2.28.88 1.62 2.55 2.55 4.42 2.55 1.55 0 2.65-.68 3.55-1.42.9.74 2 1.42 3.55 1.42 1.87 0 3.54-.93 4.42-2.55.43-.8.27-1.76-.35-2.28-.54-.45-1.27-.25-1.52.43-.3.83-1.1 1.55-2.25 1.55-1.5 0-2.4-1.15-3.85-1.15z" />
        </svg>
      );

    case 'pedidosya':
      // Isotipo oficial de 2 trazos de PedidosYa (arco superior con esquina redondeada + pierna inclinada)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M6.2 4.3h8.3c3.25 0 5.5 1.95 5.5 4.6 0 2.7-2.25 4.7-5.5 4.7H9.6l.85-3.1h3.6c1.2 0 2-.65 2-1.6 0-.9-.8-1.55-2-1.55H9.15c-1.8 0-2.95-1.15-2.95-2.85V4.3z" />
          <path d="M8.35 11.8h3.9l-1.6 5.9c-.35 1.3-1.35 2-2.7 2H5.8l2.55-7.9z" />
        </svg>
      );

    case 'mercadodelivery':
    case 'mercadopago':
    case 'mercadopago_delivery':
    case 'mercadopagodelivery':
    case 'mp':
      // Emblema oficial Mercado Pago (óvalo celeste/azul marino + apretón de manos blanco)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <ellipse
            cx="12"
            cy="12"
            rx="10"
            ry="6.8"
            fill="#00B1EA"
            stroke="#002B7A"
            strokeWidth="1.6"
          />
          <path
            d="M2.9 10.6L6.3 8.7l2.1 2.2-2.7 2.5-2.8-1.5c-.2-.4-.2-.9 0-1.3zM21.1 10.6L17.7 8.7l-2.1 2.2 2.7 2.5 2.8-1.5c.2-.4.2-.9 0-1.3z"
            fill="#FFFFFF"
            stroke="#002B7A"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 10.8c1.1-.9 2.5-.9 3.7 0l.8.6.8-.6c1.1-.9 2.5-.9 3.7 0l1.1 1-4.2 3.5c-.8.7-2 .7-2.8 0l-4.2-3.5 1.1-1z"
            fill="#FFFFFF"
            stroke="#002B7A"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'maps':
      // Ícono oficial Google Maps (tarjeta verde/amarilla/azul con "G" blanca y pin rojo superpuesto)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <clipPath id="cocinapp-gmaps-clip">
              <rect x="2" y="4.5" width="15.5" height="15.5" rx="3.2" />
            </clipPath>
          </defs>
          <g clipPath="url(#cocinapp-gmaps-clip)">
            <rect x="2" y="4.5" width="15.5" height="15.5" fill="#1EA362" />
            <path d="M2 20L10.8 11.2L17.5 17.9V20H2Z" fill="#4285F4" />
            <path d="M17.5 4.5V17.9L10.8 11.2L17.5 4.5Z" fill="#F1F3F4" />
            <path d="M1.2 18.8L16.2 3.8L18.2 5.8L3.2 20.8L1.2 18.8Z" fill="#FFE047" />
            <path
              d="M8.55 9.45H6.7v1.05h1.08c-.1.48-.52.82-1.08.82-.68 0-1.22-.54-1.22-1.22s.54-1.22 1.22-1.22c.31 0 .59.11.81.31l.78-.78A2.25 2.25 0 0 0 6.7 7.8a2.3 2.3 0 1 0 0 4.6c1.32 0 2.2-.93 2.2-2.24 0-.24-.03-.48-.08-.71z"
              fill="#FFFFFF"
            />
          </g>
          <path
            d="M16.5 2.2c-2.76 0-5 2.24-5 5 0 3.45 4.25 7.95 4.68 8.39.18.18.46.18.64 0 .43-.44 4.68-4.94 4.68-8.39 0-2.76-2.24-5-5-5z"
            fill="#EA4335"
          />
          <circle cx="16.5" cy="7.2" r="1.85" fill="#811411" />
        </svg>
      );

    case 'instagram':
      // Cámara oficial de Instagram en trazo blanco limpio
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2.1A3.5 3.5 0 0 0 4.1 7.6v8.8a3.5 3.5 0 0 0 3.5 3.5h8.8a3.5 3.5 0 0 0 3.5-3.5V7.6a3.5 3.5 0 0 0-3.5-3.5H7.6zm9.65 1.4a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 6.9a5.1 5.1 0 1 1 0 10.2 5.1 5.1 0 0 1 0-10.2zm0 2.1a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        </svg>
      );

    case 'facebook':
      // "f" oficial moderna de Facebook extendida hasta el borde inferior
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M15.12 24v-9.22h3.09l.46-3.59h-3.55V8.9c0-1.04.29-1.75 1.78-1.75h1.9V3.94c-.33-.04-1.46-.14-2.77-.14-2.74 0-4.62 1.67-4.62 4.75v2.64H8.31v3.59h3.1V24h3.71z" />
        </svg>
      );

    case 'tiktok':
      // Nota musical oficial de TikTok (cian + magenta + blanco)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
            fill="#25F4EE"
            transform="translate(-0.75, -0.55)"
          />
          <path
            d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
            fill="#FE2C55"
            transform="translate(0.75, 0.55)"
          />
          <path
            d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'twitter':
    case 'x':
      // Logotipo oficial de X en blanco de alto contraste sobre negro
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );

    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
}