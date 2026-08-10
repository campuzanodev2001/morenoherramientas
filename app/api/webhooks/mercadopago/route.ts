import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { validateWebhookSignature, getPayment } from '@/lib/payments/mercadopago'
import {
  recordPaymentEvent,
  isPaymentProcessed,
  markPaymentProcessed,
} from '@/lib/db/queries/payment-events'
import {
  getOrderWithItemsById,
  updateOrderStatus,
  confirmPendingOrder,
} from '@/lib/db/queries/orders'
import { decrementStock } from '@/lib/db/queries/products'
import { clearCart } from '@/lib/db/queries/cart'
import { logError, logInfo } from '@/lib/logger'
import { onPaymentApproved, onPaymentRejected } from '@/lib/mail/hooks'

export const runtime = 'nodejs'

const webhookSchema = z.object({
  type: z.string().optional(),
  action: z.string().optional(),
  data: z.object({ id: z.union([z.string(), z.number()]) }).optional(),
})

/** Respuesta 200 estándar: MP reintenta ante cualquier 4xx/5xx. */
const ok = () => NextResponse.json({ received: true })

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const dataIdFromQuery = url.searchParams.get('data.id')
  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')

  // Cuerpo crudo para poder loggearlo aunque el parseo falle.
  let rawBody: unknown = null
  try {
    rawBody = await request.json()
  } catch {
    rawBody = null
  }

  const parsed = webhookSchema.safeParse(rawBody)
  const dataIdFromBody = parsed.success && parsed.data.data ? String(parsed.data.data.id) : ''
  const dataId = (dataIdFromQuery ?? dataIdFromBody) || null

  // 1. Validar firma ANTES de cualquier operación. Única respuesta no-200.
  if (!validateWebhookSignature(xSignature, xRequestId, dataId)) {
    logError('webhook:mp', 'Firma x-signature inválida', { dataId })
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  try {
    // 3. Solo procesar type === 'payment'
    const type = parsed.success ? parsed.data.type : undefined
    if (type !== 'payment' || !dataId) {
      // 4. Igual guardamos el evento (append-only) para auditoría.
      await recordPaymentEvent({ event: type ?? 'unknown', payload: rawBody })
      return ok()
    }

    // 4. Guardar el evento ANTES de cualquier lógica.
    await recordPaymentEvent({ mpPaymentId: dataId, event: type, payload: rawBody })

    // 5. Idempotencia: si ya procesamos este paymentId, no repetir.
    if (await isPaymentProcessed(dataId)) {
      logInfo('webhook:mp', 'Pago ya procesado, ignorando duplicado', { dataId })
      return ok()
    }

    // 6. Consultar el pago real en MP (no confiar en el webhook).
    const payment = await getPayment(dataId)
    const orderId = payment.externalReference
    if (!orderId) {
      logError('webhook:mp', 'Pago sin external_reference', { dataId })
      return ok()
    }

    // 7. Obtener la orden.
    const order = await getOrderWithItemsById(orderId)
    if (!order) {
      logError('webhook:mp', 'Orden no encontrada para el pago', { dataId, orderId })
      return ok()
    }

    if (payment.status === 'approved') {
      // El stock se descuenta SOLO si esta llamada confirmó la orden. La
      // idempotencia por paymentId no alcanza: dos pagos aprobados distintos
      // sobre la misma orden (reintento del comprador, pago duplicado en MP)
      // descontarían stock dos veces.
      const confirmed = await db.transaction(async (tx) => {
        const updated = await confirmPendingOrder(
          orderId,
          { mpPaymentId: String(payment.id), mpStatus: payment.status, mpDetail: payment.statusDetail },
          tx,
        )
        if (!updated) return false
        for (const item of order.items) {
          if (item.productId) await decrementStock(item.productId, item.quantity, tx)
        }
        if (order.userId) await clearCart(order.userId)
        return true
      })

      await markPaymentProcessed(dataId, orderId, payment.status)

      if (!confirmed) {
        logInfo('webhook:mp', 'Orden ya no estaba pendiente, sin descontar stock', {
          dataId,
          orderId,
          status: order.status,
        })
        return ok()
      }

      revalidatePath('/')
      // Mail fire-and-forget, FUERA de la transacción.
      onPaymentApproved(orderId)
    } else if (payment.status === 'rejected') {
      await updateOrderStatus(orderId, 'cancelled', {
        mpPaymentId: String(payment.id),
        mpStatus: payment.status,
        mpDetail: payment.statusDetail,
      })
      await markPaymentProcessed(dataId, orderId, payment.status)
      onPaymentRejected(orderId)
    } else {
      // pending / in_process: mantener en 'pending', no marcar procesado.
      logInfo('webhook:mp', 'Pago pendiente, sin cambios', { dataId, status: payment.status })
    }

    return ok()
  } catch (error) {
    // SIEMPRE 200: loggear internamente, no propagar 4xx/5xx.
    logError('webhook:mp', 'Error procesando webhook', {
      dataId,
      error: error instanceof Error ? error.message : 'unknown',
    })
    return ok()
  }
}
