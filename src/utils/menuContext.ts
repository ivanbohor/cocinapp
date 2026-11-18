// src/utils/menuContext.ts
const STORAGE_KEY = 'cocinapp_delivery_mode';

/**
 * Resuelve si la carta debe operar en Modo Delivery (con carrito y pedido por WhatsApp)
 * o en Modo Salón (carta limpia para QR presencial en mesa).
 */
export function resolveMenuDeliveryMode(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const hasDeliveryParam =
    params.get('pedir') === '1' || params.get('delivery') === '1';

  // Detecta si la visita proviene de navegadores integrados o enlaces de redes sociales
  const ua = navigator.userAgent || '';
  const referrer = document.referrer || '';
  const isFromSocialApp =
    /Instagram|FBAN|FBAV|TikTok|Twitter/i.test(ua) ||
    /instagram\.com|facebook\.com|l\.facebook\.com|tiktok\.com|t\.co|linktr\.ee/i.test(
      referrer
    );

  // 1. Entrada explícita por link compartido (?pedir=1) o desde red social -> Activa Delivery
  if (hasDeliveryParam || isFromSocialApp) {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignorar bloqueos de storage en navegación privada estricta
    }

    // Limpia el parámetro de la barra de direcciones para mantener estética la URL corta
    if (hasDeliveryParam) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    return true;
  }

  // 2. Verificamos si el usuario simplemente recargó la página (F5)
  const navEntries = performance.getEntriesByType(
    'navigation'
  ) as PerformanceNavigationTiming[];
  const isPageReload = navEntries.length > 0 && navEntries[0].type === 'reload';

  if (isPageReload) {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  // 3. Navegación directa a la URL limpia (/m/bar) -> Limpia estado previo y entra en Modo Salón
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorar errores de storage
  }

  return false;
}