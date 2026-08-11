import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit/with-rate-limit'
import { handleApiError } from '@/lib/errors/handlers'
import { parseOrThrow } from '@/lib/errors/validation'
import { ValidationError } from '@/lib/errors'
import { getServerSession } from '@/lib/auth/helpers'
import { createOrderSchema } from '@/lib/validations/checkout'
import { priceCart } from '@/lib/checkout/pricing'
import { getValidQuote, markQuoteSelected } from '@/lib/db/queries/shipping'
import { createOrder } from '@/lib/db/queries/orders'
import { isTransferEnabled, transferDiscount } from '@/lib/payments/transfer'
import type { ShippingAddress } from '@/lib/db/types'

/**
 * POST /api/checkout/create-order — crea la orden en `pending` antes de pagar.
 *
 * El cobro lo hace después `process-payment` con el token del Payment Brick.
 * Acá no se habla con MercadoPago: la orden es sólo nuestra hasta ese momento.
 * Si algo falla, la orden NO se crea.
 */
async function handler(request: Request): Promise<Response> {
  try {
    // 2. Validación Zod
    const body: unknown = await request.json()
    const input = parseOrThrow(createOrderSchema, body)

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

    // 8. El método de pago se revalida contra la config del servidor: un
    // cliente no puede pedir 'transfer' —y llevarse el descuento— si el
    // negocio no tiene la cuenta cargada.
    const paymentMethod = input.paymentMethod
    if (paymentMethod === 'transfer' && !isTransferEnabled()) {
      throw new ValidationError(
        [{ field: 'paymentMethod', message: 'El pago por transferencia no está disponible' }],
        'El pago por transferencia no está disponible',
        'TRANSFER_DISABLED',
      )
    }

    // 9. Total = items - descuento + envío (todo desde el servidor).
    // El descuento se recalcula acá, nunca llega del cliente.
    const subtotal = priced.subtotal
    const discount = paymentMethod === 'transfer' ? transferDiscount(subtotal) : 0
    const shippingCost = quote.price
    const total = subtotal - discount + shippingCost

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

    // 10. Crear la orden en 'pending'
    const order = await createOrder({
      userId,
      guestEmail: userId ? null : input.buyer.email.toLowerCase(),
      guestName: userId ? null : input.buyer.name,
      paymentMethod,
      subtotal,
      discount,
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

    // 11. Respuesta controlada
    return NextResponse.json({ orderId: order.id, total, paymentMethod })
  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withRateLimit('CHECKOUT', handler)
