import { pgTable, text, integer, uuid, boolean, timestamp } from 'drizzle-orm/pg-core'
import { orders } from './orders'
import { pk } from './_helpers'

export const shippingQuotes = pgTable('shipping_quotes', {
  id: pk(),
  // Nullable: la cotización ocurre en el checkout antes de crear la orden.
  orderId: uuid('order_id').references(() => orders.id),
  carrier: text('carrier').notNull(), // 'andreani' | 'correo-argentino'
  service: text('service').notNull(),
  price: integer('price').notNull(),
  estimatedDays: integer('estimated_days'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), // 30 min desde la cotización
  selected: boolean('selected').default(false).notNull(),
})
