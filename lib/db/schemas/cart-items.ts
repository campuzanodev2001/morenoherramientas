import { pgTable, integer, uuid, timestamp, unique } from 'drizzle-orm/pg-core'
import { carts } from './carts'
import { products } from './products'
import { pk } from './_helpers'

export const cartItems = pgTable(
  'cart_items',
  {
    id: pk(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique('cart_items_cart_product_unique').on(t.cartId, t.productId)],
)
