import { pgTable, text, integer, boolean, uuid, jsonb } from 'drizzle-orm/pg-core'
import { categories } from './categories'
import { pk, createdAt, updatedAt, deletedAt } from './_helpers'

export type ProductSpec = { label: string; value: string }

export const products = pgTable('products', {
  id: pk(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // en centavos, nunca float
  compareAtPrice: integer('compare_at_price'), // precio tachado opcional
  stock: integer('stock').default(0).notNull(),
  sku: text('sku').unique(),
  barcode: text('barcode'),
  brand: text('brand'), // marca del fabricante
  // Especificaciones técnicas key/value (extensión para el formulario de admin).
  specs: jsonb('specs').$type<ProductSpec[]>().default([]).notNull(),
  active: boolean('active').default(true).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(), // soft delete
})
