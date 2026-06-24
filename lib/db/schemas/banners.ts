import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { pk } from './_helpers'

export const banners = pgTable('banners', {
  id: pk(),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  linkUrl: text('link_url'),
  order: integer('order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
})
