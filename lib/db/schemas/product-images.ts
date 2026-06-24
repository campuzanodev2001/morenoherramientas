import { pgTable, text, integer, boolean, uuid } from 'drizzle-orm/pg-core'
import { products } from './products'
import { pk } from './_helpers'

export const productImages = pgTable('product_images', {
  id: pk(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  alt: text('alt'),
  order: integer('order').default(0).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
})
