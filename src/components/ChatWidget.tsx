// src/components/ChatWidget.tsx
import { useEffect } from 'react';

export function ChatWidget() {
  useEffect(() => {
    // Si el script ya existe (por ejemplo, por un re-render), no hacemos nada
    if (document.getElementById('tawk-script')) return;

    // Inicializamos las variables globales de Tawk
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    // Creamos el script dinámicamente
    const s1 = document.createElement('script');
    s1.id = 'tawk-script';
    s1.async = true;
    // ⚠️ IMPORTANTE: Reemplazá esta URL con la tuya real que copiaste de Tawk.to
    s1.src = 'https://embed.tawk.to/6af9f12690c6963c4656a46b/1k7g5bvlb'; 
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    document.body.appendChild(s1);

    // Función de limpieza: si el usuario navega a la carta pública, ocultamos el chat
    return () => {
      if ((window as any).Tawk_API && (window as any).Tawk_API.hideWidget) {
        (window as any).Tawk_API.hideWidget();
      }
    };
  }, []);

  return null; // No renderiza nada visualmente en React
}