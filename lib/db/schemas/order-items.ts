import { pgTable, text, integer, uuid } from 'drizzle-orm/pg-core'
import { orders } from './orders'
import { products } from './products'
import { pk } from './_helpers'

/**
 * productName y unitPrice son SNAPSHOTS al momento de la compra: si el precio
 * del producto cambia mañana, las órdenes anteriores conservan el original.
 * Nunca calcular el total de una orden leyendo el precio actual del producto.
 */
export const orderItems = pgTable('order_items', {
  id: pk(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  productName: text('product_name').notNull(),
  productSku: text('product_sku'),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  subtotal: integer('subtotal').notNull(),
})
