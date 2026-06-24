import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { pk } from './_helpers'

/**
 * Idempotencia de mails. idempotencyKey = orderId + ':' + templateName.
 * Antes de enviar se consulta esta tabla; si existe, no se reenvía.
 */
export const mailLogs = pgTable('mail_logs', {
  id: pk(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  to: text('to').notNull(),
  template: text('template').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
})
