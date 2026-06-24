import { pgTable, text, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { orders } from './orders'
import { pk } from './_helpers'

/**
 * APPEND-ONLY: nunca editar ni borrar registros de esta tabla.
 * Es el log de auditoría de todos los eventos de pago. Sin updatedAt por diseño.
 */
export const paymentEvents = pgTable('payment_events', {
  id: pk(),
  orderId: uuid('order_id').references(() => orders.id),
  mpPaymentId: text('mp_payment_id'),
  mpExternalReference: text('mp_external_reference'),
  event: text('event'), // nombre del evento de MP
  payload: jsonb('payload').notNull(), // body completo del webhook
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
})
