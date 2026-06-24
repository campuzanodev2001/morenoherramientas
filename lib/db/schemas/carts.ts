import { pgTable, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'
import { pk, createdAt, updatedAt } from './_helpers'

export const carts = pgTable('carts', {
  id: pk(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})
