// src/components/modals/QRModal.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Download, Printer, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/stores/useToastStore';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  nombreRestaurante: string;
  logoUrl?: string | null;
}

export function QRModal({
  isOpen,
  onClose,
  url,
  nombreRestaurante,
  logoUrl,
}: QRModalProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Preview: QR mostrado como imagen de un canvas generado en memoria
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  // Canvas listo para descargar (con plantilla completa)
  const downloadCanvasRef = useRef<HTMLCanvasElement | null>(null);

  /* ------------------------------------------------------------------
     1. Generar el QR + la plantilla de descarga
     ------------------------------------------------------------------ */
  const generarQR = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // 🔽 Dynamic import: la librería solo se carga al abrir el modal
      const QRCode = (await import('qrcode')).default;

      // -- A. Generar QR base en un canvas temporal (alta resolución)
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, url, {
        width: 640,
        margin: 2,
        errorCorrectionLevel: 'H', // alta tolerancia a daños/estampas
        color: {
          dark: '#0f172a', // ink-900
          light: '#ffffff',
        },
      });

      // -- B. Preview: exportamos el QR solo como Data URL para mostrar
      const qrDataUrl = qrCanvas.toDataURL('image/png');
      setPreviewDataUrl(qrDataUrl);

      // -- C. Plantilla completa para descarga (canvas 800x1120)
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1120;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo crear el contexto de dibujo.');

      // Fondo blanco con borde suave
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Barra superior sutil de marca
      ctx.fillStyle = '#f97316'; // brand-500
      ctx.fillRect(0, 0, canvas.width, 12);

      // -- Header: logo (opcional)
      let cursorY = 80;

      if (logoUrl) {
        try {
          const logoImg = await loadImage(logoUrl);
          const logoSize = 120;
          // Círculo blanco detrás del logo
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, cursorY + logoSize / 2, logoSize / 2 + 6, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#f97316'; // brand-500
          ctx.stroke();
          ctx.restore();

          // Clip circular y dibujar logo
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, cursorY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logoImg, canvas.width / 2 - logoSize / 2, cursorY, logoSize, logoSize);
          ctx.restore();

          cursorY += logoSize + 40;
        } catch {
          // Si el logo falla (CORS, URL rota), seguimos sin él
          cursorY += 20;
        }
      }

      // -- Nombre del restaurante
      ctx.fillStyle = '#0f172a'; // ink-900
      ctx.font = 'bold 44px ui-sans-serif, system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      wrapText(ctx, nombreRestaurante, canvas.width / 2, cursorY, canvas.width - 120, 52);
      cursorY += 80;

      // -- Texto "Escaneá para ver nuestro menú"
      ctx.fillStyle = '#64748b'; // ink-500
      ctx.font = '500 22px ui-sans-serif, system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Escaneá para ver nuestro menú', canvas.width / 2, cursorY);
      cursorY += 60;

      // -- QR en el centro
      const qrSize = 500;
      const qrX = (canvas.width - qrSize) / 2;
      ctx.drawImage(qrCanvas, qrX, cursorY, qrSize, qrSize);

      // -- Marco sutil alrededor del QR
      ctx.strokeStyle = '#e2e8f0'; // ink-200
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 10, cursorY - 10, qrSize + 20, qrSize + 20);

      cursorY += qrSize + 40;

      // -- URL del menú
      ctx.fillStyle = '#475569'; // ink-600
      ctx.font = '500 18px ui-monospace, "SF Mono", Menlo, monospace';
      ctx.textAlign = 'center';
      const urlMostrar = url.replace(/^https?:\/\//, '');
      ctx.fillText(urlMostrar, canvas.width / 2, cursorY);
      cursorY += 50;

      // -- Footer con branding CocinApp
      ctx.fillStyle = '#f97316'; // brand-500
      ctx.font = 'bold 18px ui-sans-serif, system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Generado con CocinApp', canvas.width / 2, canvas.height - 60);

      ctx.fillStyle = '#94a3b8'; // ink-400
      ctx.font = '500 14px ui-sans-serif, system-ui, -apple-system, sans-serif';
      ctx.fillText('cocinapp-nine.vercel.app', canvas.width / 2, canvas.height - 34);

      // Guardamos el canvas para la descarga
      downloadCanvasRef.current = canvas;
    } catch (err) {
      console.error('Error generando QR:', err);
      setError('No pudimos generar el QR. Probá de nuevo en unos segundos.');
    } finally {
      setIsGenerating(false);
    }
  }, [url, nombreRestaurante, logoUrl]);

  useEffect(() => {
    if (isOpen) {
      generarQR();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  /* ------------------------------------------------------------------
     2. Acciones
     ------------------------------------------------------------------ */
  const handleDescargar = () => {
    const canvas = downloadCanvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('No pudimos generar la imagen');
        return;
      }
      const urlBlob = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = `qr-${slugify(nombreRestaurante)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(urlBlob);
      toast.success('QR descargado', 'Listo para imprimir y pegar en tus mesas.');
    }, 'image/png', 1.0);
  };

  const handleImprimir = () => {
    const canvas = downloadCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const ventana = window.open('', '_blank', 'width=900,height=1200');
    if (!ventana) {
      toast.error('Bloqueador de ventanas', 'Permití las ventanas emergentes para imprimir.');
      return;
    }

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${escapeHtml(nombreRestaurante)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; padding: 20px; }
            img { max-width: 100%; height: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            @media print {
              body { background: white; padding: 0; }
              img { box-shadow: none; }
            }
          </style>
        </head>
        <body onload="window.print();">
          <img src="${dataUrl}" alt="QR de ${escapeHtml(nombreRestaurante)}" />
        </body>
      </html>
    `);
    ventana.document.close();
  };

  const handleCopiarUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No pudimos copiar la URL');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm animate-in fade-in"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-card border border-ink-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in dark:border-ink-800 dark:bg-ink-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800 shrink-0">
          <div>
            <h2 id="qr-modal-title" className="text-base font-semibold text-ink-900 dark:text-ink-100">
              QR de tu Menú Digital
            </h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
              Imprimilo y pegalo en tus mesas o vidriera.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="-m-1 rounded p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:hover:bg-ink-800 dark:hover:text-ink-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 text-ink-500 dark:text-ink-400">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Generando tu QR...</p>
            </div>
          )}

          {error && !isGenerating && (
            <div className="flex items-start gap-3 rounded-field border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p>{error}</p>
                <button
                  onClick={generarQR}
                  className="mt-2 text-xs font-medium underline hover:no-underline"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {!isGenerating && !error && previewDataUrl && (
            <div className="space-y-4">
              {/* Vista previa del QR con marco */}
              <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-950/50 p-6 flex flex-col items-center">
                <img
                  src={previewDataUrl}
                  alt="Vista previa del QR"
                  className="w-56 h-56 rounded-lg bg-white p-2 shadow-sm"
                />
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-3 text-center max-w-[240px] break-all">
                  {url.replace(/^https?:\/\//, '')}
                </p>
              </div>

              {/* Info de la plantilla */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <p className="font-semibold mb-1">📄 Plantilla de descarga</p>
                <p className="leading-relaxed">
                  La imagen descargable incluye tu logo, nombre del restaurante,
                  la URL del menú y la marca CocinApp. Lista para imprimir en A4 o A5.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="border-t border-ink-100 px-5 py-4 dark:border-ink-800 shrink-0">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopiarUrl}
              className="w-full sm:w-auto"
              disabled={isGenerating}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={16} className="mr-2 text-emerald-500" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-2" />
                  Copiar URL
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleImprimir}
              className="w-full sm:w-auto"
              disabled={isGenerating || !!error}
            >
              <Printer size={16} className="mr-2" />
              Imprimir
            </Button>

            <Button
              type="button"
              onClick={handleDescargar}
              className="w-full sm:w-auto"
              disabled={isGenerating || !!error}
            >
              <Download size={16} className="mr-2" />
              Descargar PNG
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Dibuja texto con saltos de línea automáticos si excede el ancho.
 * Devuelve la altura total ocupada (para calcular el cursorY siguiente).
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineHeight);
  });

  return lines.length * lineHeight;
}