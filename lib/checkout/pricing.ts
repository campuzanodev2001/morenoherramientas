import { getActiveProductsByIds } from '@/lib/db/queries/products'
import { ValidationError } from '@/lib/errors'
import type { CartLineInput } from '@/lib/validations/checkout'

export type PricedLine = {
  productId: string
  productName: string
  productSku: string | null
  quantity: number
  unitPrice: number // centavos, SIEMPRE desde la DB
  subtotal: number
  stock: number
}

export type PricedCart = {
  lines: PricedLine[]
  subtotal: number
  totalUnits: number
}

/**
 * Recalcula el carrito en el servidor a partir de los ids + cantidades que
 * manda el cliente. Los precios SIEMPRE salen de la DB; el precio del cliente
 * se ignora por completo (regla de seguridad de checkout).
 *
 * @param requireStock si es true, falla con ValidationError listando los
 *   productos sin stock suficiente. Para cotizar envío se usa false.
 */
export async function priceCart(
  items: CartLineInput[],
  { requireStock = true }: { requireStock?: boolean } = {},
): Promise<PricedCart> {
  const ids = [...new Set(items.map((it) => it.productId))]
  const products = await getActiveProductsByIds(ids)

  const unavailable = items.filter((it) => !products.has(it.productId))
  if (unavailable.length > 0) {
    throw new ValidationError(
      unavailable.map((it) => ({
        field: it.productId,
        message: 'El producto ya no está disponible',
      })),
      'Algunos productos ya no están disponibles',
      'PRODUCT_UNAVAILABLE',
    )
  }

  if (requireStock) {
    const outOfStock = items.filter((it) => {
      const p = products.get(it.productId)
      return !p || p.stock < it.quantity
    })
    if (outOfStock.length > 0) {
      throw new ValidationError(
        outOfStock.map((it) => {
          const p = products.get(it.productId)
          return {
            field: it.productId,
            message: `Solo quedan ${p?.stock ?? 0} unidades de ${p?.name ?? 'este producto'}`,
          }
        }),
        'Algunos productos no tienen stock suficiente',
        'INSUFFICIENT_STOCK',
      )
    }
  }

  const lines: PricedLine[] = items.map((it) => {
    // Non-null: ya validamos arriba que todos existen.
    const p = products.get(it.productId)!
    return {
      productId: p.id,
      productName: p.name,
      productSku: p.sku,
      quantity: it.quantity,
      unitPrice: p.price,
      subtotal: p.price * it.quantity,
      stock: p.stock,
    }
  })

  return {
    lines,
    subtotal: lines.reduce((acc, l) => acc + l.subtotal, 0),
    totalUnits: lines.reduce((acc, l) => acc + l.quantity, 0),
  }
}
