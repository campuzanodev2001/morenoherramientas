/** Formatea un precio en centavos a pesos argentinos. */
export function formatPrice(cents: number): string {
  return '$' + Math.round(cents / 100).toLocaleString('es-AR')
}
