import { pgTable, text, jsonb } from 'drizzle-orm/pg-core'
import { pk, updatedAt } from './_helpers'

export const pages = pgTable('pages', {
  id: pk(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  content: jsonb('content'), // contenido rico (editor)
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  updatedAt: updatedAt(),
})
