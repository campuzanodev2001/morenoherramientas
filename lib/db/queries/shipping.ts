import { and, eq, gt } from 'drizzle-orm'
import { db, type DbOrTx } from '@/lib/db'
import { shippingQuotes } from '@/lib/db/schemas'
import type { ShippingQuote } from '@/lib/db/types'
import type { ShippingQuoteResult } from '@/lib/shipping/types'

/** Minutos de validez de una cotización de envío. */
export const QUOTE_TTL_MS = 30 * 60 * 1000

/** Persiste las cotizaciones de los carriers con expiración de 30 minutos. */
export async function saveShippingQuotes(
  results: ShippingQuoteResult[],
): Promise<ShippingQuote[]> {
  if (results.length === 0) return []
  const expiresAt = new Date(Date.now() + QUOTE_TTL_MS)
  return db
    .insert(shippingQuotes)
    .values(
      results.map((r) => ({
        carrier: r.carrier,
        service: r.service,
        price: r.price,
        estimatedDays: r.estimatedDays,
        expiresAt,
      })),
    )
    .returning()
}

/** Cotización válida (no expirada) por id. Null si no existe o expiró. */
export async function getValidQuote(quoteId: string): Promise<ShippingQuote | null> {
  const [row] = await db
    .select()
    .from(shippingQuotes)
    .where(and(eq(shippingQuotes.id, quoteId), gt(shippingQuotes.expiresAt, new Date())))
    .limit(1)
  return row ?? null
}

/** Marca una cotización como seleccionada y la asocia a una orden. */
export async function markQuoteSelected(
  quoteId: string,
  orderId: string,
  executor: DbOrTx = db,
): Promise<void> {
  await executor
    .update(shippingQuotes)
    .set({ selected: true, orderId })
    .where(eq(shippingQuotes.id, quoteId))
}
