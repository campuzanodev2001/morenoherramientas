import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit/with-rate-limit'
import { handleApiError } from '@/lib/errors/handlers'
import { parseOrThrow } from '@/lib/errors/validation'
import { ValidationError } from '@/lib/errors'
import { getServerSession } from '@/lib/auth/helpers'
import { createPreferenceSchema } from '@/lib/validations/checkout'
import { priceCart } from '@/lib/checkout/pricing'
import { getValidQuote, markQuoteSelected } from '@/lib/db/queries/shipping'
import { createOrder, setOrderPreferenceId } from '@/lib/db/queries/orders'
import { createPreference } from '@/lib/payments/mercadopago'
import type { ShippingAddress } from '@/lib/db/types'

/**
 * POST /api/checkout/create-preference — flujo de 12 pasos (04-cart-checkout.md).
 * Si algo falla antes de crear la orden, la orden NO se crea.
 */
async function handler(request: Request): Promise<Response> {
  try {
    // 2. Validación Zod
    const body: unknown = await request.json()
    const input = parseOrThrow(createPreferenceSchema, body)

    // 3-6. Recalcular precios desde la DB + verificar stock (nunca del cliente)
    const priced = await priceCart(input.items, { requireStock: true })
    if (priced.lines.length === 0) {
      throw new ValidationError([{ field: 'items', message: 'El carrito está vacío' }])
    }

    // 7. Verificar que la cotización de envío no expiró
    const quote = await getValidQuote(input.shippingQuoteId)
    if (!quote) {
      throw new ValidationError(
        [{ field: 'shippingQuoteId', message: 'La cotización de envío expiró. Volvé a calcularla.' }],
        'La cotización de envío expiró',
        'QUOTE_EXPIRED',
      )
    }

    // 8. Total = items + envío (todo desde el servidor)
    const subtotal = priced.subtotal
    const shippingCost = quote.price
    const total = subtotal + shippingCost

    const session = await getServerSession()
    const userId = session?.user?.id ?? null

    const shippingAddress: ShippingAddress = {
      street: input.shippingAddress.street,
      number: input.shippingAddress.number,
      floor: input.shippingAddress.floor,
      apartment: input.shippingAddress.apartment,
      city: input.shippingAddress.city,
      province: input.shippingAddress.province,
      postalCode: input.shippingAddress.postalCode,
      country: input.shippingAddress.country,
    }

    // 9. Crear la orden en 'pending'
    const order = await createOrder({
      userId,
      guestEmail: userId ? null : input.buyer.email.toLowerCase(),
      guestName: userId ? null : input.buyer.name,
      subtotal,
      shippingCost,
      total,
      shippingAddress,
      shippingMethod: quote.service,
      shippingCarrier: quote.carrier,
      items: priced.lines.map((l) => ({
        productId: l.productId,
        productName: l.productName,
        productSku: l.productSku,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        subtotal: l.subtotal,
      })),
    })

    await markQuoteSelected(quote.id, order.id)

    // 10. Crear preferencia en MP (precios en pesos)
    const preference = await createPreference({
      orderId: order.id,
      payerEmail: input.buyer.email,
      items: [
        ...priced.lines.map((l) => ({
          title: l.productName,
          quantity: l.quantity,
          unitPrice: l.unitPrice / 100,
        })),
        { title: `Envío (${quote.service})`, quantity: 1, unitPrice: shippingCost / 100 },
      ],
    })

    // 11. Guardar mpPreferenceId
    await setOrderPreferenceId(order.id, preference.id)

    // 12. Respuesta controlada
    return NextResponse.json({ preferenceId: preference.id, orderId: order.id, total })
  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withRateLimit('CHECKOUT', handler)
