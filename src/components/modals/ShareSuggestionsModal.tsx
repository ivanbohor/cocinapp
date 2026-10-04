// src/components/modals/ShareSuggestionsModal.tsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Loader2, Download, Share2, Check, Image as ImageIcon,
  Sparkles, Palette, Square, Settings2, Sun, Moon,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/stores/useToastStore';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────
   Tipos
   ───────────────────────────────────────────────────────── */
export interface ProductoSugerencia {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

export interface RestauranteShareData {
  nombre: string;
  slug: string;
  logo_url: string | null;
  color_principal: string;
  color_tarjeta: string;
  color_fondo?: string;
  whatsapp?: string | null;
  direccion?: string | null;
}

export type TemplateStyle = 'clasico' | 'vibrante' | 'personalizado';

export interface SavedShareOptions {
  template: TemplateStyle;
  title: string;
  subtitle: string;
  maxDishes: number;
  showImages: boolean;
  theme: 'dark' | 'light';
  bgColor: string;
  accentColor: string;
}

interface CustomOptions {
  title: string;
  subtitle: string;
  maxDishes: number;
  showImages: boolean;
  theme: 'dark' | 'light';
  bgColor: string;
  accentColor: string;
}

interface ShareSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurante: RestauranteShareData;
  sugerencias: ProductoSugerencia[];
  initialOptions?: SavedShareOptions | null;
  onSaveOptions?: (opts: SavedShareOptions) => void;
}

/* ─────────────────────────────────────────────────────────
   Defaults
   ───────────────────────────────────────────────────────── */
function getDefaults(restaurante: RestauranteShareData): CustomOptions {
  return {
    title: 'Sugerencias del Chef',
    subtitle: '',
    maxDishes: 3,
    showImages: false,
    theme: 'dark',
    bgColor: '#1c1c1c',
    accentColor: restaurante.color_principal || '#f97316',
  };
}

/* ─────────────────────────────────────────────────────────
   Cache de imágenes — evita re-pedir imágenes rotas
   ───────────────────────────────────────────────────────── */
const imageCache = new Map<string, HTMLImageElement | 'FAILED'>();

function loadImageCached(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);

  const cached = imageCache.get(src);
  if (cached === 'FAILED') return Promise.resolve(null);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      imageCache.set(src, 'FAILED');
      resolve(null);
    };
    img.src = src;
  });
}

/** Permite reintentar si el usuario actualiza una URL */
export function clearShareImageCache() {
  imageCache.clear();
}

/* ─────────────────────────────────────────────────────────
   Helpers de dibujo
   ───────────────────────────────────────────────────────── */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function isDarkColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const [r, g, b] = clean.match(/.{2}/g)!.map((c) => parseInt(c, 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 0.5;
}

interface SizeSpec {
  nameFont: number;
  priceFont: number;
  imageSize: number;
  gapBetween: number;
  centerVertically: boolean;
}

function getPersonalizadoSizes(dishCount: number, showImages: boolean): SizeSpec {
  switch (dishCount) {
    case 1:
      return { nameFont: showImages ? 64 : 84, priceFont: showImages ? 52 : 68, imageSize: showImages ? 200 : 0, gapBetween: 40, centerVertically: true };
    case 2:
      return { nameFont: showImages ? 60 : 72, priceFont: showImages ? 48 : 60, imageSize: showImages ? 170 : 0, gapBetween: 56, centerVertically: true };
    case 3:
      return { nameFont: showImages ? 52 : 64, priceFont: showImages ? 44 : 54, imageSize: showImages ? 140 : 0, gapBetween: 48, centerVertically: true };
    case 4:
      return { nameFont: showImages ? 44 : 52, priceFont: showImages ? 38 : 46, imageSize: showImages ? 120 : 0, gapBetween: 40, centerVertically: false };
    default:
      return { nameFont: showImages ? 40 : 48, priceFont: showImages ? 34 : 42, imageSize: showImages ? 100 : 0, gapBetween: 32, centerVertically: false };
  }
}

/* ─────────────────────────────────────────────────────────
   Render: Personalizado
   ───────────────────────────────────────────────────────── */
async function renderPersonalizado(
  ctx: CanvasRenderingContext2D,
  restaurante: RestauranteShareData,
  productos: ProductoSugerencia[],
  options: CustomOptions
): Promise<void> {
  const W = 1080;
  const H = 1920;
  const isDark = options.theme === 'dark';

  const bgColor = options.bgColor || (isDark ? '#1c1c1c' : (restaurante.color_fondo || '#fbfaf7'));
  const accentColor = options.accentColor || restaurante.color_principal;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  if (isDark) {
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    for (let i = 0; i < 800; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const grad = ctx.createRadialGradient(W / 2, H / 2, H / 3, W / 2, H / 2, H);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = 'rgba(15,23,42,0.02)';
    for (let x = 30; x < W; x += 60) {
      for (let y = 30; y < H; y += 60) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const bgIsDark = isDarkColor(bgColor);
  const textColor = bgIsDark ? '#ffffff' : '#0f172a';
  const subtitleColor = bgIsDark ? 'rgba(255,255,255,0.68)' : '#64748b';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  let cursorY = 80;

  // Logo
  const logo = await loadImageCached(restaurante.logo_url);
  if (logo) {
    const logoSize = 110;
    const logoX = (W - logoSize) / 2;

    if (bgIsDark) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, cursorY + logoSize / 2, logoSize / 2 + 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, cursorY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, logoX, cursorY, logoSize, logoSize);
    ctx.restore();

    cursorY += logoSize + 26;
  }

  // Nombre
  ctx.fillStyle = textColor;
  ctx.font = 'bold 32px ui-sans-serif, system-ui, -apple-system, sans-serif';
  ctx.fillText(truncate(restaurante.nombre, 32), W / 2, cursorY);
  cursorY += 62;

  // Título
  ctx.fillStyle = textColor;
  ctx.font = 'bold 72px "Georgia", "Times New Roman", serif';
  const titleLines = wrapTextLines(ctx, options.title, W - 120);
  titleLines.forEach((line) => {
    ctx.fillText(line, W / 2, cursorY);
    cursorY += 82;
  });
  cursorY += 4;

  // Subtítulo
  if (options.subtitle.trim()) {
    ctx.fillStyle = subtitleColor;
    ctx.font = '500 28px ui-sans-serif, system-ui, -apple-system, sans-serif';
    const subLines = options.subtitle
      .split('\n')
      .flatMap((l) => (l.trim() === '' ? [''] : wrapTextLines(ctx, l, W - 160)));
    subLines.forEach((line) => {
      if (line === '') {
        cursorY += 14;
      } else {
        ctx.fillText(line, W / 2, cursorY);
        cursorY += 38;
      }
    });
  }

  // Platos
  const footerHeight = 260;
  const dishesStartY = cursorY + 60;
  const availableHeight = H - footerHeight - dishesStartY;
  const sizes = getPersonalizadoSizes(productos.length, options.showImages);

  let totalDishesHeight = 0;
  for (const prod of productos) {
    if (options.showImages && prod.image_url) {
      totalDishesHeight += sizes.imageSize + 20;
    }
    ctx.font = `bold ${sizes.nameFont}px "Georgia", "Times New Roman", serif`;
    const nameLines = wrapTextLines(ctx, prod.name, W - 140);
    totalDishesHeight += nameLines.length * sizes.nameFont * 1.1;
    totalDishesHeight += sizes.priceFont * 1.4 + sizes.gapBetween;
  }
  totalDishesHeight = Math.max(0, totalDishesHeight - sizes.gapBetween);

  let dishY = dishesStartY;
  if (sizes.centerVertically) {
    const freeSpace = availableHeight - totalDishesHeight;
    const offset = Math.min(Math.max(0, freeSpace * 0.35), 200);
    dishY += offset;
  }

  for (const prod of productos) {
    if (options.showImages && prod.image_url) {
      const img = await loadImageCached(prod.image_url);
      if (img) {
        const imgSize = sizes.imageSize;
        const imgX = (W - imgSize) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, dishY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, imgX, dishY, imgSize, imgSize);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(W / 2, dishY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = bgIsDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.1)';
        ctx.lineWidth = 3;
        ctx.stroke();

        dishY += imgSize + 20;
      }
    }

    ctx.fillStyle = textColor;
    ctx.font = `bold ${sizes.nameFont}px "Georgia", "Times New Roman", serif`;
    const nameLines = wrapTextLines(ctx, prod.name, W - 140);
    nameLines.forEach((line) => {
      ctx.fillText(line, W / 2, dishY);
      dishY += sizes.nameFont * 1.1;
    });

    ctx.fillStyle = accentColor;
    ctx.font = `bold ${sizes.priceFont}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    ctx.fillText(`$${prod.price.toLocaleString()}`, W / 2, dishY);
    dishY += sizes.priceFont * 1.4 + sizes.gapBetween;
  }

  // Footer
  const footerY = H - footerHeight + 20;

  ctx.strokeStyle = bgIsDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, footerY);
  ctx.lineTo(W - 120, footerY);
  ctx.stroke();

  const hasWhatsapp = !!(restaurante.whatsapp && restaurante.whatsapp.trim());
  const hasDireccion = !!(restaurante.direccion && restaurante.direccion.trim());

  ctx.textAlign = 'center';
  ctx.fillStyle = subtitleColor;
  ctx.font = '500 28px ui-sans-serif, system-ui, -apple-system, sans-serif';

  let contactY = footerY + 40;
  if (hasWhatsapp && hasDireccion) {
    ctx.fillText(`📱  ${restaurante.whatsapp}`, W / 2, contactY);
    contactY += 50;
    ctx.fillText(`📍  ${restaurante.direccion}`, W / 2, contactY);
  } else if (hasWhatsapp) {
    ctx.fillText(`📱  ${restaurante.whatsapp}`, W / 2, contactY);
  } else if (hasDireccion) {
    ctx.fillText(`📍  ${restaurante.direccion}`, W / 2, contactY);
  }

  ctx.fillStyle = bgIsDark ? 'rgba(255,255,255,0.28)' : '#cbd5e1';
  ctx.font = '500 20px ui-sans-serif, system-ui, -apple-system, sans-serif';
  ctx.fillText('Generado con CocinApp', W / 2, H - 55);
}

/* ─────────────────────────────────────────────────────────
   Render: Clásico / Vibrante
   ───────────────────────────────────────────────────────── */
async function renderClasicoOVibrante(
  canvas: HTMLCanvasElement,
  restaurante: RestauranteShareData,
  productos: ProductoSugerencia[],
  template: 'clasico' | 'vibrante'
): Promise<void> {
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No hay contexto 2D');

  const isVibrant = template === 'vibrante';
  const bgColor = isVibrant ? restaurante.color_principal : '#fafafa';
  const primaryText = isVibrant ? '#ffffff' : '#0f172a';
  const secondaryText = isVibrant ? 'rgba(255,255,255,0.8)' : '#64748b';
  const accentColor = isVibrant ? '#ffffff' : restaurante.color_principal;
  const cardBg = isVibrant ? 'rgba(255,255,255,0.14)' : restaurante.color_tarjeta || '#ffffff';
  const cardBorder = isVibrant ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.08)';

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  if (!isVibrant) {
    ctx.fillStyle = 'rgba(15,23,42,0.025)';
    for (let x = 20; x < W; x += 40) {
      for (let y = 20; y < H; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.fillStyle = isVibrant ? 'rgba(255,255,255,0.95)' : restaurante.color_principal;
  ctx.fillRect(0, 0, W, 14);

  let cursorY = 120;

  const logo = await loadImageCached(restaurante.logo_url);
  if (logo) {
    const logoSize = 180;
    const logoX = (W - logoSize) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, cursorY + logoSize / 2, logoSize / 2 + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = isVibrant ? '#ffffff' : restaurante.color_principal;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, cursorY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, logoX, cursorY, logoSize, logoSize);
    ctx.restore();

    cursorY += logoSize + 40;
  }

  ctx.fillStyle = primaryText;
  ctx.font = 'bold 68px ui-sans-serif, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(truncate(restaurante.nombre, 26), W / 2, cursorY);
  cursorY += 95;

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 260, cursorY);
  ctx.lineTo(W / 2 - 40, cursorY);
  ctx.moveTo(W / 2 + 40, cursorY);
  ctx.lineTo(W / 2 + 260, cursorY);
  ctx.stroke();
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('✦', W / 2, cursorY - 15);
  cursorY += 50;

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 42px ui-sans-serif, system-ui, -apple-system, sans-serif';
  ctx.fillText('SUGERENCIAS DEL CHEF', W / 2, cursorY);
  cursorY += 90;

  const productosAMostrar = productos.slice(0, 5);
  const cardPadding = 80;
  const cardGap = 22;
  const disponibleHasta = H - 280;
  const disponibleParaCards = disponibleHasta - cursorY;
  const cardHeight = Math.min(
    260,
    (disponibleParaCards - cardGap * (productosAMostrar.length - 1)) / productosAMostrar.length
  );

  for (const prod of productosAMostrar) {
    const cardX = cardPadding;
    const cardW = W - cardPadding * 2;

    ctx.fillStyle = cardBg;
    roundRect(ctx, cardX, cursorY, cardW, cardHeight, 28);
    ctx.fill();

    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, cursorY, cardW, cardHeight, 28);
    ctx.stroke();

    const imageSize = Math.min(180, cardHeight - 40);
    const imageX = cardX + cardW - imageSize - 30;
    const imageY = cursorY + (cardHeight - imageSize) / 2;

    if (prod.image_url) {
      const img = await loadImageCached(prod.image_url);
      if (img) {
        ctx.save();
        roundRect(ctx, imageX, imageY, imageSize, imageSize, 18);
        ctx.clip();
        ctx.drawImage(img, imageX, imageY, imageSize, imageSize);
        ctx.restore();
      }
    }

    const textX = cardX + 32;
    ctx.textAlign = 'left';
    ctx.fillStyle = isVibrant ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 40px ui-sans-serif, system-ui, -apple-system, sans-serif';
    ctx.fillText(truncate(prod.name, 22), textX, cursorY + 34);

    if (prod.description) {
      ctx.fillStyle = isVibrant ? 'rgba(255,255,255,0.75)' : '#64748b';
      ctx.font = '24px ui-sans-serif, system-ui, -apple-system, sans-serif';
      ctx.fillText(truncate(prod.description, 32), textX, cursorY + 90);
    }

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 46px ui-sans-serif, system-ui, -apple-system, sans-serif';
    ctx.fillText(`$${prod.price.toLocaleString()}`, textX, cursorY + cardHeight - 78);

    cursorY += cardHeight + cardGap;
  }

  const footerY = H - 220;
  ctx.strokeStyle = isVibrant ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, footerY - 40);
  ctx.lineTo(W - 120, footerY - 40);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = secondaryText;
  ctx.font = '500 26px ui-sans-serif, system-ui, -apple-system, sans-serif';
  ctx.fillText('Visitá nuestra carta digital', W / 2, footerY);

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 32px ui-monospace, "SF Mono", Menlo, monospace';
  ctx.fillText(`cocinapp-nine.vercel.app/m/${restaurante.slug}`, W / 2, footerY + 44);

  ctx.fillStyle = isVibrant ? 'rgba(255,255,255,0.45)' : '#94a3b8';
  ctx.font = '500 22px ui-sans-serif, system-ui, -apple-system, sans-serif';
  ctx.fillText('Generado con CocinApp', W / 2, H - 80);
}

/* ─────────────────────────────────────────────────────────
   Dispatcher
   ───────────────────────────────────────────────────────── */
async function renderStory(
  canvas: HTMLCanvasElement,
  restaurante: RestauranteShareData,
  productos: ProductoSugerencia[],
  template: TemplateStyle,
  customOptions: CustomOptions
): Promise<void> {
  if (template === 'personalizado') {
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No hay contexto 2D');
    await renderPersonalizado(ctx, restaurante, productos, customOptions);
    return;
  }
  await renderClasicoOVibrante(canvas, restaurante, productos, template);
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png', 1.0);
  });
}

function canvasToFile(canvas: HTMLCanvasElement, filename: string): Promise<File | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(null); return; }
      resolve(new File([blob], filename, { type: 'image/png' }));
    }, 'image/png', 1.0);
  });
}

/* ─────────────────────────────────────────────────────────
   Componente
   ───────────────────────────────────────────────────────── */
export function ShareSuggestionsModal({
  isOpen,
  onClose,
  restaurante,
  sugerencias,
  initialOptions,
  onSaveOptions,
}: ShareSuggestionsModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [template, setTemplate] = useState<TemplateStyle>('clasico');
  const [customOptions, setCustomOptions] = useState<CustomOptions>(() => getDefaults(restaurante));
  const [currentPage, setCurrentPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderIdRef = useRef(0);

  const canShare = typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function';

  /* Reset + carga de opciones guardadas al abrir */
  useEffect(() => {
    if (!isOpen) return;

    setSelectedIds(sugerencias.map((s) => s.id));
    setPreviewUrl('');
    setError(null);
    setCurrentPage(0);

    if (initialOptions) {
      const { template: savedTemplate, ...savedCustom } = initialOptions;
      setTemplate(savedTemplate || 'clasico');
      setCustomOptions({
        ...getDefaults(restaurante),
        ...savedCustom,
      });
    } else {
      setTemplate('clasico');
      setCustomOptions(getDefaults(restaurante));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Bloquear scroll
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const productosSeleccionados = useMemo(
    () => sugerencias.filter((s) => selectedIds.includes(s.id)),
    [sugerencias, selectedIds]
  );

  const chunks = useMemo<ProductoSugerencia[][]>(() => {
    if (template === 'personalizado') {
      const limit = customOptions.maxDishes;
      const result: ProductoSugerencia[][] = [];
      for (let i = 0; i < productosSeleccionados.length; i += limit) {
        result.push(productosSeleccionados.slice(i, i + limit));
      }
      return result.length > 0 ? result : [[]];
    }
    return [productosSeleccionados.slice(0, 5)];
  }, [productosSeleccionados, template, customOptions.maxDishes]);

  const totalPages = chunks.length;

  useEffect(() => {
    if (currentPage >= totalPages) setCurrentPage(0);
  }, [currentPage, totalPages]);

  const productsForCurrentPage = chunks[currentPage] || [];

  const generarPreview = useCallback(async () => {
    if (productsForCurrentPage.length === 0) {
      setPreviewUrl('');
      return;
    }

    const myId = ++renderIdRef.current;
    setIsGenerating(true);
    setError(null);

    try {
      const canvas = document.createElement('canvas');
      await renderStory(canvas, restaurante, productsForCurrentPage, template, customOptions);
      if (myId !== renderIdRef.current) return;
      canvasRef.current = canvas;
      setPreviewUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      if (myId !== renderIdRef.current) return;
      console.error('Error generando preview:', err);
      setError('No pudimos generar la imagen. Probá de nuevo.');
    } finally {
      if (myId === renderIdRef.current) setIsGenerating(false);
    }
  }, [productsForCurrentPage, restaurante, template, customOptions]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => { void generarPreview(); }, 180);
    return () => clearTimeout(t);
  }, [isOpen, generarPreview]);

  const toggleProducto = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const updateCustom = <K extends keyof CustomOptions>(key: K, value: CustomOptions[K]) => {
    setCustomOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleThemeChange = (theme: 'dark' | 'light') => {
    setCustomOptions((prev) => ({
      ...prev,
      theme,
      bgColor: theme === 'dark' ? '#1c1c1c' : (restaurante.color_fondo || '#fbfaf7'),
    }));
  };

  const handleResetColors = () => {
    setCustomOptions((prev) => ({
      ...prev,
      bgColor: prev.theme === 'dark' ? '#1c1c1c' : (restaurante.color_fondo || '#fbfaf7'),
      accentColor: restaurante.color_principal || '#f97316',
    }));
  };

  /* Guardar preferencias: se llama después de descargar o compartir */
  const persistirPreferencias = () => {
    if (!onSaveOptions) return;
    onSaveOptions({
      template,
      title: customOptions.title,
      subtitle: customOptions.subtitle,
      maxDishes: customOptions.maxDishes,
      showImages: customOptions.showImages,
      theme: customOptions.theme,
      bgColor: customOptions.bgColor,
      accentColor: customOptions.accentColor,
    });
  };

  const handleDescargar = async () => {
    if (totalPages === 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      await downloadCanvas(canvas, `sugerencias-${restaurante.slug}.png`);
      persistirPreferencias();
      toast.success('Imagen descargada', 'Lista para subir a tu historia.');
      return;
    }

    setIsExporting(true);
    try {
      for (let i = 0; i < chunks.length; i++) {
        const canvas = document.createElement('canvas');
        await renderStory(canvas, restaurante, chunks[i], template, customOptions);
        await downloadCanvas(canvas, `sugerencias-${restaurante.slug}-${i + 1}de${chunks.length}.png`);
        await new Promise((r) => setTimeout(r, 250));
      }
      persistirPreferencias();
      toast.success(`${chunks.length} imágenes descargadas`, 'Revisá tu carpeta de descargas.');
    } catch (err) {
      console.error('Error al exportar páginas:', err);
      toast.error('No pudimos descargar todas las imágenes');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCompartir = async () => {
    if (totalPages === 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const file = await canvasToFile(canvas, `sugerencias-${restaurante.slug}.png`);
      if (!file) return;

      if (!navigator.canShare?.({ files: [file] })) {
        toast.warning('Compartir no disponible', 'Usá "Descargar PNG".');
        return;
      }
      try {
        await navigator.share({
          files: [file],
          title: 'Sugerencias del Chef',
          text: `Mirá las sugerencias de ${restaurante.nombre}`,
        });
        persistirPreferencias();
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error al compartir:', err);
          toast.error('No pudimos compartir la imagen');
        }
      }
      return;
    }

    setIsExporting(true);
    try {
      const files: File[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const canvas = document.createElement('canvas');
        await renderStory(canvas, restaurante, chunks[i], template, customOptions);
        const file = await canvasToFile(canvas, `sugerencias-${restaurante.slug}-${i + 1}de${chunks.length}.png`);
        if (file) files.push(file);
      }

      if (!navigator.canShare?.({ files })) {
        toast.warning(
          'Compartir múltiples no disponible',
          'Usá "Descargar todo" para bajar las imágenes.'
        );
        return;
      }

      try {
        await navigator.share({
          files,
          title: 'Sugerencias del Chef',
          text: `Mirá las sugerencias de ${restaurante.nombre}`,
        });
        persistirPreferencias();
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error al compartir:', err);
          toast.error('No pudimos compartir las imágenes');
        }
      }
    } catch (err) {
      console.error('Error al preparar imágenes:', err);
      toast.error('No pudimos generar las imágenes');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const hasEnoughForMultiple = totalPages > 1;
  const labelDescargar = hasEnoughForMultiple ? `Descargar todo (${totalPages})` : 'Descargar PNG';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm animate-in fade-in"
      />

      <div className="relative z-10 w-full max-w-5xl rounded-card border border-ink-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in dark:border-ink-800 dark:bg-ink-900 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800 shrink-0">
          <div>
            <h2 id="share-modal-title" className="text-base font-semibold text-ink-900 dark:text-ink-100 flex items-center gap-2">
              <Share2 size={18} className="text-brand-500" />
              Compartir Sugerencias
            </h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
              Generá una imagen lista para tu historia de WhatsApp o Instagram.
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {sugerencias.length === 0 ? (
            <div className="p-10 text-center text-ink-500 dark:text-ink-400">
              <Sparkles size={40} className="mx-auto mb-3 text-ink-300 dark:text-ink-600" />
              <p className="text-sm">Todavía no marcaste ningún plato como <strong>Sugerencia del Chef</strong>.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
              {/* Preview */}
              <div className="flex flex-col items-center">
                {hasEnoughForMultiple && (
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      aria-label="Página anterior"
                      className="h-8 w-8 rounded-full border border-ink-200 dark:border-ink-700 flex items-center justify-center text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-ink-700 dark:text-ink-300 tabular-nums">
                      Imagen {currentPage + 1} de {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                      aria-label="Página siguiente"
                      className="h-8 w-8 rounded-full border border-ink-200 dark:border-ink-700 flex items-center justify-center text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {!hasEnoughForMultiple && (
                  <p className="text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-3">
                    Vista Previa — Story 9:16
                  </p>
                )}

                <div className="relative w-[280px] h-[497px] rounded-2xl overflow-hidden border-4 border-ink-900 dark:border-ink-700 shadow-2xl bg-ink-100 dark:bg-ink-800">
                  {isGenerating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-ink-900/70 backdrop-blur-sm z-10">
                      <Loader2 className="h-6 w-6 animate-spin text-brand-500 mb-2" />
                      <p className="text-xs text-ink-600 dark:text-ink-300">Generando...</p>
                    </div>
                  )}
                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}
                  {previewUrl && !error && (
                    <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="text-[10px] text-ink-400 mt-2 text-center max-w-[280px]">
                  Se descarga en 1080×1920px (alta resolución).
                </p>
              </div>

              {/* Panel de configuración */}
              <div className="space-y-5">
                {/* Template selector */}
                <div>
                  <label className="text-sm font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-2 mb-2">
                    <Palette size={16} /> Estilo de plantilla
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { setTemplate('clasico'); setCurrentPage(0); }}
                      className={cn(
                        'rounded-field border px-2 py-3 text-xs font-medium transition-colors',
                        template === 'clasico'
                          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-700'
                          : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
                      )}
                    >
                      <div className="flex items-center justify-center gap-1"><Square size={12} /> Clásico</div>
                      <p className="text-[10px] opacity-70 mt-1">Fondo claro</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTemplate('vibrante'); setCurrentPage(0); }}
                      className={cn(
                        'rounded-field border px-2 py-3 text-xs font-medium transition-colors',
                        template === 'vibrante'
                          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-700'
                          : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
                      )}
                    >
                      <div className="flex items-center justify-center gap-1"><Sparkles size={12} /> Vibrante</div>
                      <p className="text-[10px] opacity-70 mt-1">Color de marca</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTemplate('personalizado'); setCurrentPage(0); }}
                      className={cn(
                        'rounded-field border px-2 py-3 text-xs font-medium transition-colors',
                        template === 'personalizado'
                          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-700'
                          : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
                      )}
                    >
                      <div className="flex items-center justify-center gap-1"><Settings2 size={12} /> Personalizado</div>
                      <p className="text-[10px] opacity-70 mt-1">Tipo pizarrón</p>
                    </button>
                  </div>
                </div>

                {/* Panel de personalización */}
                {template === 'personalizado' && (
                  <div className="space-y-4 rounded-lg border border-ink-200 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-950/40 p-3">
                    <div>
                      <label className="text-xs font-semibold text-ink-700 dark:text-ink-300 block mb-1.5">
                        Fondo
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleThemeChange('dark')}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-field border px-3 py-2 text-xs font-medium transition-colors',
                            customOptions.theme === 'dark'
                              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-700'
                              : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                          )}
                        >
                          <Moon size={12} /> Oscuro
                        </button>
                        <button
                          type="button"
                          onClick={() => handleThemeChange('light')}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-field border px-3 py-2 text-xs font-medium transition-colors',
                            customOptions.theme === 'light'
                              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-700'
                              : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                          )}
                        >
                          <Sun size={12} /> Claro
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-ink-700 dark:text-ink-300">
                          Colores
                        </label>
                        <button
                          type="button"
                          onClick={handleResetColors}
                          className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-medium"
                        >
                          Restaurar por defecto
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                            Fondo
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customOptions.bgColor}
                              onChange={(e) => updateCustom('bgColor', e.target.value)}
                              className="h-8 w-10 rounded border cursor-pointer dark:border-ink-700 bg-transparent shrink-0"
                            />
                            <span className="text-[10px] font-mono font-bold text-ink-700 dark:text-ink-300 truncate">
                              {customOptions.bgColor.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                            Acento
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customOptions.accentColor}
                              onChange={(e) => updateCustom('accentColor', e.target.value)}
                              className="h-8 w-10 rounded border cursor-pointer dark:border-ink-700 bg-transparent shrink-0"
                            />
                            <span className="text-[10px] font-mono font-bold text-ink-700 dark:text-ink-300 truncate">
                              {customOptions.accentColor.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-ink-700 dark:text-ink-300 block mb-1.5">
                        Platos por imagen
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => updateCustom('maxDishes', n)}
                            className={cn(
                              'rounded-field border px-0 py-2 text-sm font-bold transition-colors',
                              customOptions.maxDishes === n
                                ? 'border-brand-500 bg-brand-500 text-white'
                                : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      {productosSeleccionados.length > customOptions.maxDishes && (
                        <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-1.5 font-medium">
                          Se generarán {totalPages} imágenes ({productosSeleccionados.length} platos seleccionados).
                        </p>
                      )}
                    </div>

                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-xs font-semibold text-ink-700 dark:text-ink-300">
                        Mostrar imagen del plato
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={customOptions.showImages}
                        onClick={() => updateCustom('showImages', !customOptions.showImages)}
                        className={cn(
                          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                          customOptions.showImages ? 'bg-brand-500' : 'bg-ink-300 dark:bg-ink-700'
                        )}
                      >
                        <span
                          className={cn(
                            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                            customOptions.showImages ? 'translate-x-4' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </label>

                    <div>
                      <label className="text-xs font-semibold text-ink-700 dark:text-ink-300 block mb-1.5">
                        Título principal
                      </label>
                      <Input
                        value={customOptions.title}
                        onChange={(e) => updateCustom('title', e.target.value)}
                        placeholder="Sugerencias del Chef"
                        maxLength={40}
                        className="h-9 text-sm dark:bg-ink-900 dark:border-ink-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-ink-700 dark:text-ink-300 block mb-1.5">
                        Subtítulo <span className="font-normal opacity-60">(opcional, Enter para nueva línea)</span>
                      </label>
                      <textarea
                        value={customOptions.subtitle}
                        onChange={(e) => updateCustom('subtitle', e.target.value)}
                        placeholder="Ej: Precios en efectivo / Take Away o Delivery"
                        rows={2}
                        maxLength={120}
                        className="w-full rounded-field border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-sm outline-none resize-none dark:text-white focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    <div className="text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed pt-1 border-t border-ink-200 dark:border-ink-800">
                      📌 El WhatsApp y la dirección se toman automáticamente de tu <strong>Perfil de Negocio</strong>.
                      Tus preferencias de esta plantilla se guardan al descargar o compartir.
                    </div>
                  </div>
                )}

                {/* Selección de platos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-ink-800 dark:text-ink-200">
                      Platos a incluir
                    </label>
                    <span className="text-[11px] font-mono text-ink-500 dark:text-ink-400">
                      {productosSeleccionados.length} seleccionados
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                    {sugerencias.map((s) => {
                      const isSelected = selectedIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors',
                            isSelected
                              ? 'border-brand-300 bg-brand-50/60 dark:bg-brand-950/20 dark:border-brand-800'
                              : 'border-ink-200 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-800/50'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProducto(s.id)}
                            className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
                          />
                          {s.image_url ? (
                            <img
                              src={s.image_url}
                              alt=""
                              className="w-9 h-9 rounded object-cover shrink-0 bg-ink-100 dark:bg-ink-800"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded bg-ink-100 dark:bg-ink-800 grid place-items-center shrink-0">
                              <ImageIcon size={14} className="text-ink-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-ink-800 dark:text-ink-100 truncate">
                              {s.name}
                            </p>
                            <p className="text-[10px] text-ink-500 dark:text-ink-400">
                              ${s.price.toLocaleString()}
                            </p>
                          </div>
                          {isSelected && <Check size={14} className="text-brand-500 shrink-0" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {sugerencias.length > 0 && (
          <div className="border-t border-ink-100 px-5 py-4 dark:border-ink-800 shrink-0">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>

              {canShare && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCompartir}
                  disabled={isGenerating || isExporting || !previewUrl || productosSeleccionados.length === 0}
                  className="w-full sm:w-auto"
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Preparando...
                    </>
                  ) : (
                    <>
                      <Share2 size={16} className="mr-2" />
                      {hasEnoughForMultiple ? `Compartir ${totalPages} imágenes` : 'Compartir'}
                    </>
                  )}
                </Button>
              )}

              <Button
                type="button"
                onClick={handleDescargar}
                disabled={isGenerating || isExporting || !previewUrl || productosSeleccionados.length === 0}
                className="w-full sm:w-auto"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download size={16} className="mr-2" />
                    {labelDescargar}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}