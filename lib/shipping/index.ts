import { ShippingError } from '@/lib/errors'
import { logWarn } from '@/lib/logger'
import { saveShippingQuotes } from '@/lib/db/queries/shipping'
import { quoteAndreani } from './andreani'
import { quoteCorreoArgentino } from './correo-argentino'
import type { ShipmentInfo } from './types'

/** Peso estimado por unidad cuando el producto no declara peso (gramos). */
const DEFAULT_UNIT_WEIGHT = 1000

export type ShippingOption = {
  id: string // id de shipping_quotes, para seleccionar en create-preference
  carrier: 'andreani' | 'correo-argentino'
  service: string
  price: number
  estimatedDays: number
}

export type QuoteItem = { quantity: number }

/**
 * Cotiza el envío en paralelo a Andreani y Correo Argentino, persiste cada
 * cotización (expira en 30 min) y devuelve las opciones ordenadas por precio.
 *
 * - Si una API falla, devuelve la otra.
 * - Si las dos fallan, lanza `ShippingError`.
 */
export async function quoteShipping(
  postalCode: string,
  items: QuoteItem[],
): Promise<ShippingOption[]> {
  const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0)
  const info: ShipmentInfo = {
    postalCode,
    totalUnits,
    weightGrams: Math.max(totalUnits, 1) * DEFAULT_UNIT_WEIGHT,
  }

  const settled = await Promise.allSettled([quoteAndreani(info), quoteCorreoArgentino(info)])

  const results = settled
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof quoteAndreani>>> => {
      if (r.status === 'rejected') {
        logWarn('shipping', 'Un carrier falló la cotización', {
          error: r.reason instanceof Error ? r.reason.message : 'unknown',
        })
      }
      return r.status === 'fulfilled'
    })
    .map((r) => r.value)

  if (results.length === 0) {
    throw new ShippingError()
  }

  const saved = await saveShippingQuotes(results)
  return saved
    .map((q) => ({
      id: q.id,
      carrier: q.carrier as ShippingOption['carrier'],
      service: q.service,
      price: q.price,
      estimatedDays: q.estimatedDays ?? 0,
    }))
    .sort((a, b) => a.price - b.price)
}
