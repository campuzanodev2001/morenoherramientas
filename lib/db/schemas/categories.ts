import { pgTable, text, integer, boolean, uuid, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { pk } from './_helpers'

export const categories = pgTable('categories', {
  id: pk(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  parentId: uuid('parent_id').references((): AnyPgColumn => categories.id), // null = categoría raíz
  order: integer('order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
})
