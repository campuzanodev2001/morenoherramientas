import { pgTable, text, integer, uuid, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'
import { orderStatus } from './enums'
import { pk, createdAt, updatedAt } from './_helpers'

export type ShippingAddress = {
  street: string
  number: string
  floor?: string | undefined
  apartment?: string | undefined
  city: string
  province: string
  postalCode: string
  country: string
}

export const orders = pgTable('orders', {
  id: pk(),
  orderNumber: text('order_number').notNull().unique(), // legible: FE-2024-0001
  userId: uuid('user_id').references(() => users.id), // null si es compra de invitado
  guestEmail: text('guest_email'),
  guestName: text('guest_name'),
  status: orderStatus('status').default('pending').notNull(),
  subtotal: integer('subtotal').notNull(), // en centavos
  shippingCost: integer('shipping_cost').notNull(),
  total: integer('total').notNull(),
  shippingAddress: jsonb('shipping_address').$type<ShippingAddress>().notNull(),
  shippingMethod: text('shipping_method'),
  shippingCarrier: text('shipping_carrier'),
  trackingNumber: text('tracking_number'),
  mpPaymentId: text('mp_payment_id'),
  mpPreferenceId: text('mp_preference_id'),
  mpStatus: text('mp_status'),
  mpDetail: text('mp_detail'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})
