import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { userRole } from './enums'
import { pk, createdAt, updatedAt, deletedAt } from './_helpers'

export const users = pgTable('users', {
  id: pk(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'), // avatar de Google OAuth
  role: userRole('role').default('customer').notNull(),
  passwordHash: text('password_hash'), // null para usuarios de Google OAuth
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: deletedAt(), // soft delete
})
