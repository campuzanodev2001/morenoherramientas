import { timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * Column builders compartidos.
 * - IDs: uuid generado en la app con crypto.randomUUID() (regla de 01-database.md).
 * - updatedAt: se actualiza automáticamente en cada mutación vía $onUpdate.
 */
export const pk = () => uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID())

export const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull()

export const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())

export const deletedAt = () => timestamp('deleted_at', { withTimezone: true })
