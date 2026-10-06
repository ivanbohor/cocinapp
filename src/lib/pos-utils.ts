// src/lib/pos-utils.ts
/**
 * Redondeo de importes para el POS.
 *
 * Algoritmo:
 *  - Si el resto del precio (mod 100) es > 50 → redondear al siguiente 100
 *  - Si el resto es > 0 (y <= 50) → redondear al siguiente 50
 *  - Si el resto es 0 → dejar igual
 *
 * Ejemplos:
 *  12.675,85 → 12.700
 *  12.620,00 → 12.650
 *  12.550,00 → 12.550
 *  12.600,00 → 12.600
 *
 * Notas:
 *  - Siempre redondea HACIA ARRIBA. El comercio nunca pierde.
 *  - Se aplica sobre el monto bruto final (con recargos).
 *  - Retorna un entero (sin decimales).
 */
export function roundPosAmount(monto: number): number {
  if (!isFinite(monto) || monto <= 0) return 0;

  const resto = Math.floor(monto) % 100;
  const base = Math.floor(monto / 100) * 100;

  if (resto > 50) return base + 100;
  if (resto > 0) return base + 50;
  return base;
}

/**
 * Aplica redondeo si está habilitado, si no devuelve el número tal cual.
 * Wrapper para usar en el POS sin condicionales repetidos.
 */
export function applyRounding(
  monto: number,
  enabled: boolean
): number {
  return enabled ? roundPosAmount(monto) : monto;
}