// src/lib/ticket.ts

export interface TicketRestaurante {
  nombre: string;
  direccion: string | null;
  whatsapp: string | null;
  logo_url?: string | null;
  color_principal?: string;
}

export interface TicketItem {
  name: string;
  quantity: number;
  price: number;          // precio unitario final (con recargo si aplica)
  originalPrice: number;  // precio de lista
}

export interface TicketData {
  restaurante: TicketRestaurante;
  items: TicketItem[];
  mesa: string;
  fecha: Date;
  subtotal: number;
  discountValue: number;         // valor en AR$ del descuento
  discountMode: 'percent' | 'amount';
  discountAmountRaw: number;     // lo que el usuario tipeó
  surchargeValue: number;        // valor en AR$ del recargo
  surchargePct: number;          // % del recargo
  paymentMethod: string;
  total: number;
  splitCount: number;
  amountPerPerson: number;
  paperWidth?: 58 | 80;   // ← NUEVO


}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;')
   .replace(/'/g, '&#039;');

const money = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;

/** Genera el HTML del ticket listo para imprimir (80mm). */
export function buildTicketHtml(data: TicketData): string {
  const {
    restaurante, items, mesa, fecha,
    subtotal, discountValue, discountMode, discountAmountRaw,
    surchargeValue, surchargePct,
    paymentMethod, total, splitCount, amountPerPerson,
    paperWidth = 58,
  } = data;

  // Cálculo del ancho: la impresora tiene margen mecánico de ~5mm por lado
  const printWidth = paperWidth === 80 ? 68 : 44;
  const padX = paperWidth === 80 ? '3mm 2mm 6mm' : '2mm 1mm 5mm';
  const baseFont = paperWidth === 80 ? 14 : 12;
  const itemFont = paperWidth === 80 ? 14 : 12;
  const totalFont = paperWidth === 80 ? 24 : 20;

  const fechaStr = fecha.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  const itemsHtml = items.map((it) => {
    const sub = it.price * it.quantity;
    return `
      <tr>
        <td class="qty">${it.quantity}×</td>
        <td class="name">${escapeHtml(it.name)}</td>
        <td class="price">${money(sub)}</td>
      </tr>
    `;
  }).join('');

  const discountLabel = discountMode === 'percent'
    ? `Descuento (${discountAmountRaw}%)`
    : 'Descuento';

  const discountRow = discountValue > 0
    ? `<tr><td class="lbl">${discountLabel}</td><td class="val">- ${money(discountValue)}</td></tr>`
    : '';

    const surchargeRow = surchargeValue > 0
  ? `<tr><td class="lbl">Recargo Pago Electrónico (${surchargePct}%)</td><td class="val">+ ${money(surchargeValue)}</td></tr>`
  : '';
  
  //borrado roundingRow

  const splitRow = splitCount > 1
    ? `<tr><td class="lbl">División (${splitCount} pers.)</td><td class="val">${money(amountPerPerson)}</td></tr>`
    : '';

  const headerContacto: string[] = [];
  if (restaurante.direccion) headerContacto.push(escapeHtml(restaurante.direccion));
  if (restaurante.whatsapp) headerContacto.push(`Tel: ${escapeHtml(restaurante.whatsapp)}`);

  return `<!DOCTYPE html>
            <html lang="es">
            <head>
            <meta charset="utf-8" />
            <title>Ticket - ${escapeHtml(restaurante.nombre)}</title>
            <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }

            html, body {
                font-family: "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
                font-size: ${baseFont}px;
                line-height: 1.5;
                color: #000;
                background: #fff;
                font-weight: 700;
                -webkit-font-smoothing: none;
                text-rendering: geometricPrecision;
            }

            .ticket {
                width: ${printWidth}mm;
                margin: 0 auto;
                padding: ${padX};
            }

            .center { text-align: center; }
            .bold { font-weight: 900; }

            .restaurant-name {
                font-size: ${baseFont + 4}px;
                font-weight: 900;
                letter-spacing: 0.3px;
                text-transform: uppercase;
                word-break: break-word;
            }

            .meta { font-size: ${baseFont - 1}px; }

            .sep {
                border-top: 1.5px solid #000;
                margin: 5px 0;
            }

            table { width: 100%; border-collapse: collapse; table-layout: fixed; }

            td {
                vertical-align: top;
                padding: 1.5px 0;
                font-size: ${itemFont}px;
                font-weight: 700;
                word-wrap: break-word;
                overflow-wrap: break-word;
            }

            td.qty {
                width: 12%;
                font-weight: 900;
                white-space: nowrap;
            }

            td.name {
                width: 58%;
                padding-left: 2px;
                padding-right: 4px;
            }

            td.price {
                width: 30%;
                text-align: right;
                white-space: nowrap;
                font-weight: 900;
            }

            table.totals td {
                font-size: ${baseFont - 1}px;
                font-weight: 700;
            }
            table.totals td.lbl { text-align: left; }
            table.totals td.val {
                text-align: right;
                white-space: nowrap;
                font-weight: 900;
                padding-left: 6px;
            }

            .total-label {
                font-size: ${totalFont - 4}px;
                font-weight: 900;
                letter-spacing: 0.3px;
            }
            .total-value {
                font-size: ${totalFont}px;
                font-weight: 900;
                letter-spacing: 0.1px;
                text-align: right;
                white-space: nowrap;
            }

            .payment-line {
                font-size: ${baseFont + 1}px;
                font-weight: 900;
                text-align: center;
                padding: 2px 0;
            }

            .footer {
                font-size: ${baseFont - 1}px;
                font-weight: 700;
                text-align: center;
                margin-top: 3px;
            }

            .branding {
                font-size: ${baseFont - 3}px;
                font-weight: 600;
                text-align: center;
                margin-top: 4px;
                opacity: 0.7;
            }

            @page {
                size: ${paperWidth}mm auto;
                margin: 0;
            }

            @media print {
                html, body { width: ${paperWidth}mm; }
                .ticket { width: ${printWidth}mm; }
                html { zoom: 1; }
            }
            </style>
            </head>
            <body onload="window.focus(); window.print();">
            <div class="ticket">
                <div class="center restaurant-name">${escapeHtml(restaurante.nombre)}</div>
                ${headerContacto.map((l) => `<div class="center meta">${l}</div>`).join('')}

                <div class="sep"></div>

                <table>
                <tr>
                    <td class="meta" style="width:60px;"><b>Mesa:</b></td>
                    <td class="meta" style="text-align:right;"><b>${escapeHtml(mesa || 'Caja')}</b></td>
                </tr>
                <tr>
                    <td class="meta"><b>Fecha:</b></td>
                    <td class="meta" style="text-align:right;">${fechaStr}</td>
                </tr>
                </table>

                <div class="sep"></div>

                <table>${itemsHtml}</table>

                <div class="sep"></div>

                <table class="totals">
                <tr>
                    <td class="lbl">Subtotal</td>
                    <td class="val">${money(subtotal)}</td>
                </tr>
                ${discountRow}
                ${surchargeRow}
                ${splitRow}
                </table>

                <div class="sep"></div>

                <table>
                <tr>
                    <td class="total-label">TOTAL</td>
                    <td class="total-value">${money(total)}</td>
                </tr>
                </table>
                <div class="payment-line">Método: ${escapeHtml(paymentMethod === 'Tarjeta' ? 'Pago Electrónico' : paymentMethod)}</div>


                <div class="sep"></div>

                <div class="footer bold">¡Gracias por elegirnos!</div>
                <div class="branding">Ticket generado con CocinApp</div>
            </div>
            </body>
            </html>`;
            }
/** Abre una ventana nueva con el ticket y dispara el diálogo de impresión. */
export function printTicket(data: TicketData) {
  const html = buildTicketHtml(data);
  const win = window.open('', '_blank', 'width=420,height=720');
  if (!win) {
    throw new Error('Bloqueador de ventanas. Permití las ventanas emergentes.');
  }
  win.document.write(html);
  win.document.close();
}

/** Genera un canvas con el ticket (para compartir como imagen). */
/** Genera un canvas con el ticket branded (para compartir como imagen). */
export async function buildTicketCanvas(data: TicketData): Promise<HTMLCanvasElement> {
  const {
    restaurante, items, mesa, fecha,
    subtotal, discountValue, discountMode, discountAmountRaw,
    surchargeValue, surchargePct,
    paymentMethod, total, splitCount, amountPerPerson,
  } = data;

  const brand = restaurante.color_principal || '#f97316';
  const SCALE = 2;
  const W = 440;
  const PAD = 24;
  const LH = 30;
  const LH_SMALL = 22;
  const LH_BIG = 60;
  const LH_SEP = 20;
  const RADIUS = 20;

  // ─── Pre-calcular altura ────────────────────────────
  let h = 0;
  h += 32;                                   // top padding
  h += 12;                                   // barra superior
  if (restaurante.logo_url) h += 96;
  h += 34;                                   // nombre
  if (restaurante.direccion) h += LH_SMALL;
  if (restaurante.whatsapp) h += LH_SMALL;
  h += 28;                                   // espacio
  h += LH_SEP + 4;                           // separador
  h += LH * 2;                               // mesa + fecha
  h += LH_SEP + 4;                           // separador
  h += items.length * LH * 1.35;
  h += LH_SEP + 4;                           // separador
  h += LH;                                   // subtotal
  if (discountValue > 0) h += LH;
  if (surchargeValue > 0) h += LH;
  if (splitCount > 1) h += LH;
  h += LH_SEP + 4;                           // separador
  h += LH_BIG;                               // total
  h += LH + 8;                               // método
  h += LH_SEP + 6;                           // separador
  h += LH_SMALL + 4;                         // gracias
  h += LH_SMALL;                             // branding
  h += 28;                                   // bottom padding

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = Math.ceil(h) * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  // ─── Fondo oscuro con esquinas redondeadas ──────────
  ctx.fillStyle = '#0f172a';                 // ink-900
  ctx.beginPath();
  ctx.roundRect(0, 0, W, h, RADIUS);
  ctx.fill();

  // ─── Barra superior de marca ────────────────────────
  ctx.fillStyle = brand;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, 8, [RADIUS, RADIUS, 0, 0]);
  ctx.fill();

  // ─── Helpers ────────────────────────────────────────
  const center = (text: string, y: number, size = 14, weight = '400', color = '#ffffff') => {
    ctx.font = `${weight} ${size}px "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(text, W / 2, y);
  };
  const left = (text: string, x: number, y: number, size = 14, weight = '400', color = '#ffffff') => {
    ctx.font = `${weight} ${size}px "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  };
  const right = (text: string, x: number, y: number, size = 14, weight = '400', color = '#ffffff') => {
    ctx.font = `${weight} ${size}px "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  };
  const separator = (y: number) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
  };

  let y = 32;

  // ─── Logo ───────────────────────────────────────────
  if (restaurante.logo_url) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = 'anonymous';
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = restaurante.logo_url!;
      });

      const size = 72;
      const cx = W / 2;
      const cy = y + size / 2;

      // Fondo circular blanco
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2 + 4, 0, Math.PI * 2);
      ctx.fill();

      // Clip y dibujar
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - size / 2, y, size, size);
      ctx.restore();

      y += 96;
    } catch {
      // sin logo
    }
  }

  // ─── Nombre restaurante ─────────────────────────────
  center(restaurante.nombre.toUpperCase(), y, 22, '800');
  y += 34;

  // ─── Contacto ───────────────────────────────────────
  if (restaurante.direccion) {
    center(restaurante.direccion, y, 12, '500', 'rgba(255,255,255,0.65)');
    y += LH_SMALL;
  }
  if (restaurante.whatsapp) {
    center(`Tel: ${restaurante.whatsapp}`, y, 12, '500', 'rgba(255,255,255,0.65)');
    y += LH_SMALL;
  }

  y += 28;

  // ─── Separador ──────────────────────────────────────
  separator(y);
  y += LH_SEP + 4;

  // ─── Meta ───────────────────────────────────────────
  left('Mesa:', PAD + 4, y, 13, '500', 'rgba(255,255,255,0.55)');
  right(mesa || 'Caja', W - PAD - 4, y, 13, '800');
  y += LH;

  const fechaStr = fecha.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  left('Fecha:', PAD + 4, y, 13, '500', 'rgba(255,255,255,0.55)');
  right(fechaStr, W - PAD - 4, y, 13, '600', 'rgba(255,255,255,0.85)');
  y += LH;

  separator(y);
  y += LH_SEP + 4;

  // ─── Items ──────────────────────────────────────────
  for (const it of items) {
    const sub = it.price * it.quantity;
    left(`${it.quantity}×`, PAD + 4, y, 14, '800', brand);
    left(it.name, PAD + 34, y, 14, '600', '#ffffff');
    right(money(sub), W - PAD - 4, y, 14, '800', '#ffffff');
    y += LH * 1.35;
  }

  y += LH_SEP - 6;
  separator(y);
  y += LH_SEP + 4;

  // ─── Totales ────────────────────────────────────────
  left('Subtotal', PAD + 4, y, 13, '500', 'rgba(255,255,255,0.65)');
  right(money(subtotal), W - PAD - 4, y, 13, '600', '#ffffff');
  y += LH;

  if (discountValue > 0) {
    const label = discountMode === 'percent'
      ? `Descuento (${discountAmountRaw}%)`
      : 'Descuento';
    left(label, PAD + 4, y, 13, '500', '#34d399');   // emerald-400
    right(`- ${money(discountValue)}`, W - PAD - 4, y, 13, '700', '#34d399');
    y += LH;
  }
  if (surchargeValue > 0) {
    left(`Recargo Pago Electrónico (${surchargePct}%)`, PAD + 4, y, 13, '500', brand);
    right(`+ ${money(surchargeValue)}`, W - PAD - 4, y, 13, '700', brand);
    y += LH;
    }
  



  if (splitCount > 1) {
    left(`División (${splitCount} pers.)`, PAD + 4, y, 13, '500', 'rgba(255,255,255,0.65)');
    right(money(amountPerPerson), W - PAD - 4, y, 13, '700', '#ffffff');
    y += LH;
  }

  y += LH_SEP - 8;
  separator(y);
  y += LH_SEP - 2;

  // ─── TOTAL en banner de marca ───────────────────────
  const bannerH = LH_BIG - 6;
  const bannerX = PAD - 4;
  const bannerW = W - (PAD - 4) * 2;

  ctx.fillStyle = brand;
  ctx.beginPath();
  ctx.roundRect(bannerX, y, bannerW, bannerH, 12);
  ctx.fill();

  // Texto dentro del banner
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 15px "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TOTAL', bannerX + 16, y + bannerH / 2);

  ctx.font = '900 26px "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(money(total), bannerX + bannerW - 16, y + bannerH / 2);

  y += LH_BIG;

  // ─── Método de pago ─────────────────────────────────
  center(`Método: ${paymentMethod === 'Tarjeta' ? 'Pago Electrónico' : paymentMethod}`, y, 13, '600', 'rgba(255,255,255,0.85)');


  separator(y);
  y += LH_SEP - 2;

  // ─── Footer ─────────────────────────────────────────
  center('¡Gracias por elegirnos!', y, 14, '700', '#ffffff');
  y += LH_SMALL + 4;

  center('Ticket generado con CocinApp', y, 10, '500', 'rgba(255,255,255,0.4)');

  return canvas;
}

/** Convierte el canvas a File PNG listo para compartir. */
export function canvasToTicketFile(canvas: HTMLCanvasElement, filename: string): Promise<File | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(null); return; }
      resolve(new File([blob], filename, { type: 'image/png' }));
    }, 'image/png', 1.0);
  });
}