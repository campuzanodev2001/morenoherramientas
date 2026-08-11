import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit/with-rate-limit'
import { handleApiError } from '@/lib/errors/handlers'
import { parseOrThrow } from '@/lib/errors/validation'
import { ValidationError } from '@/lib/errors'
import { getServerSession } from '@/lib/auth/helpers'
import { processPaymentSchema } from '@/lib/validations/checkout'
import { getOrderWithItemsById } from '@/lib/db/queries/orders'
import { createPayment } from '@/lib/payments/mercadopago'
import { logInfo } from '@/lib/logger'

/**
 * POST /api/checkout/process-payment — cierre del Payment Brick.
 *
 * El Brick tokeniza la tarjeta en el browser (los datos sensibles nunca tocan
 * este servidor) y manda el token acá. El monto se toma de la orden ya creada,
 * jamás del cliente.
 *
 * No toca el stock ni marca la orden como pagada: eso lo hace el webhook, que
 * es la única fuente de verdad del estado del pago.
 */
async function handler(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json()
    const input = parseOrThrow(processPaymentSchema, body)

    const order = await getOrderWithItemsById(input.orderId)
    if (!order) {
      throw new ValidationError([{ field: 'orderId', message: 'La orden no existe' }])
    }

    // Autorización: una orden de usuario logueado sólo la paga su dueño. Las de
    // invitado se protegen con el uuid de la orden, que actúa como capability.
    const session = await getServerSession()
    if (order.userId && order.userId !== session?.user?.id) {
      throw new ValidationError([{ field: 'orderId', message: 'La orden no existe' }])
    }

    // Sólo se paga una orden pendiente: evita recobrar algo ya confirmado.
    if (order.status !== 'pending') {
      throw new ValidationError(
        [{ field: 'orderId', message: 'Esta orden ya no está pendiente de pago' }],
        'La orden ya fue procesada',
        'ORDER_NOT_PENDING',
      )
    }

    // Una orden de transferencia ya tiene el 10% descontado en `total`:
    // cobrarla por MercadoPago sería regalar el descuento. Para pagar con
    // tarjeta hay que volver al checkout y crear una orden nueva.
    if (order.paymentMethod === 'transfer') {
      throw new ValidationError(
        [{ field: 'orderId', message: 'Esta orden se paga por transferencia bancaria' }],
        'Esta orden se paga por transferencia bancaria',
        'ORDER_IS_TRANSFER',
      )
    }

    const payment = await createPayment({
      orderId: order.id,
      amountCents: order.total,
      description: `Orden ${order.orderNumber}`,
      token: input.token,
      paymentMethodId: input.paymentMethodId,
      issuerId: input.issuerId,
      installments: input.installments,
      payerEmail: input.payer.email,
      payerIdentification: input.payer.identification,
    })

    logInfo('checkout:payment', 'Pago creado', {
      orderId: order.id,
      paymentId: String(payment.id),
      status: payment.status,
    })

    // El estado definitivo lo escribe el webhook. Esto es sólo para la UI.
    return NextResponse.json({
      orderId: order.id,
      status: payment.status,
      statusDetail: payment.statusDetail,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withRateLimit('CHECKOUT', handler)
