import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { paymentEvents } from '@/lib/db/schemas'
import type { PaymentEvent } from '@/lib/db/types'

/** Registra un evento de pago (APPEND-ONLY): nunca se edita ni se borra. */
export async function recordPaymentEvent(data: {
  orderId?: string | null
  mpPaymentId?: string | null
  mpExternalReference?: string | null
  event?: string | null
  payload: unknown
}): Promise<void> {
  await db.insert(paymentEvents).values({
    orderId: data.orderId ?? null,
    mpPaymentId: data.mpPaymentId ?? null,
    mpExternalReference: data.mpExternalReference ?? null,
    event: data.event ?? null,
    payload: data.payload,
  })
}

/**
 * Idempotencia: indica si ya procesamos (confirmamos/rechazamos) este paymentId.
 * Se marca poniendo `event` = 'processed:<status>' al terminar la lógica.
 */
export async function isPaymentProcessed(mpPaymentId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: paymentEvents.id })
    .from(paymentEvents)
    .where(
      and(
        eq(paymentEvents.mpPaymentId, mpPaymentId),
        eq(paymentEvents.event, `processed:${mpPaymentId}`),
      ),
    )
    .limit(1)
  return Boolean(row)
}

/** Marca un paymentId como ya procesado (para idempotencia). */
export async function markPaymentProcessed(
  mpPaymentId: string,
  orderId: string,
  status: string,
): Promise<void> {
  await recordPaymentEvent({
    orderId,
    mpPaymentId,
    event: `processed:${mpPaymentId}`,
    payload: { status, processedAt: new Date().toISOString() },
  })
}

/** Historial de eventos de pago de una orden (para el panel admin). */
export async function getPaymentEventsByOrder(orderId: string): Promise<PaymentEvent[]> {
  return db
    .select()
    .from(paymentEvents)
    .where(eq(paymentEvents.orderId, orderId))
    .orderBy(paymentEvents.receivedAt)
}
