import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit/with-rate-limit'
import { handleApiError } from '@/lib/errors/handlers'
import { parseOrThrow } from '@/lib/errors/validation'
import { ValidationError } from '@/lib/errors'
import { getServerSession } from '@/lib/auth/helpers'
import { createPreferenceSchema } from '@/lib/validations/checkout'
import { getOrderWithItemsById } from '@/lib/db/queries/orders'
import { createPreference } from '@/lib/payments/mercadopago'
import { logInfo } from '@/lib/logger'

/**
 * POST /api/checkout/create-preference — preferencia de la orden.
 *
 * Habilita en el Payment Brick los medios que no se cobran con token de
 * tarjeta: "Dinero en cuenta de Mercado Pago" y "Cuotas sin tarjeta". El Brick
 * necesita un `preferenceId` para mostrarlos; al elegirlos redirige a MP y el
 * resultado vuelve por el webhook.
 *
 * Los ítems y el monto salen de la orden en la DB, nunca del cliente.
 */
async function handler(request: Request): Promise<Response> {
  try {
    // 4. Validación Zod
    const body: unknown = await request.json()
    const input = parseOrThrow(createPreferenceSchema, body)

    const order = await getOrderWithItemsById(input.orderId)
    if (!order) {
      throw new ValidationError([{ field: 'orderId', message: 'La orden no existe' }])
    }

    // 3. Autorización: misma regla que process-payment. La orden de un usuario
    // logueado sólo la paga su dueño; la de invitado se protege con el uuid.
    const session = await getServerSession()
    if (order.userId && order.userId !== session?.user?.id) {
      throw new ValidationError([{ field: 'orderId', message: 'La orden no existe' }])
    }

    if (order.status !== 'pending') {
      throw new ValidationError(
        [{ field: 'orderId', message: 'Esta orden ya no está pendiente de pago' }],
        'La orden ya fue procesada',
        'ORDER_NOT_PENDING',
      )
    }

    const payerEmail = order.guestEmail ?? session?.user?.email
    if (!payerEmail) {
      throw new ValidationError([{ field: 'orderId', message: 'La orden no tiene email de contacto' }])
    }

    const preferenceId = await createPreference({
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items.map((item) => ({
        title: item.productName,
        quantity: item.quantity,
        unitPriceCents: item.unitPrice,
      })),
      shippingCents: order.shippingCost,
      payerEmail,
      payerName: order.guestName ?? session?.user?.name ?? undefined,
    })

    logInfo('checkout:preference', 'Preferencia creada', { orderId: order.id })

    // 6. Respuesta controlada: sólo el id, nada del payload de MP.
    return NextResponse.json({ preferenceId })
  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withRateLimit('CHECKOUT', handler)
