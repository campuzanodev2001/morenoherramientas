/**
 * Precios derivados que se muestran en la ficha y en las cards.
 *
 * Todo se calcula acá y no en los componentes: el descuento por transferencia
 * también lo aplica el checkout al cobrar, así que la constante tiene que ser
 * una sola en todo el proyecto.
 */

/** Descuento por pago con transferencia bancaria. 0.10 = 10%. */
export const TRANSFER_DISCOUNT = 0.1

/**
 * Cuotas que se promocionan en la card. Tiene que coincidir con lo que esté
 * configurado en la cuenta de Mercado Pago: si allá no hay 3 sin interés,
 * bajar `interestFree` a false o cambiar el número acá.
 */
export const INSTALLMENTS = { count: 3, interestFree: true } as const

/** Umbral para avisar "últimas N unidades" en vez del stock crudo. */
export const LOW_STOCK_THRESHOLD = 5

/** Precio con descuento por transferencia, en centavos. */
export function transferPrice(cents: number): number {
  return Math.round(cents * (1 - TRANSFER_DISCOUNT))
}

/** Monto de cada cuota, en centavos. */
export function installmentAmount(cents: number): number {
  return Math.round(cents / INSTALLMENTS.count)
}

/**
 * Porcentaje de descuento respecto del precio tachado.
 * Devuelve null si no hay un descuento real que mostrar.
 */
export function discountPercent(price: number, compareAtPrice: number | null): number | null {
  if (compareAtPrice == null || compareAtPrice <= price) return null
  const pct = Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
  return pct > 0 ? pct : null
}
