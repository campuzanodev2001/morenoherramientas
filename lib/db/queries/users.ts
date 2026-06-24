import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schemas'
import type { User } from '@/lib/db/types'

/** Columnas seguras: nunca incluye passwordHash ni deletedAt. */
const safeColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  image: users.image,
  role: users.role,
  emailVerified: users.emailVerified,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const

export type SafeUser = {
  id: string
  email: string
  name: string | null
  image: string | null
  role: User['role']
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * SOLO para uso interno de autenticación (incluye passwordHash). Nunca exponer
 * el resultado al cliente.
 */
export async function getUserByEmailWithHash(email: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
    .limit(1)
  return user ?? null
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  const [user] = await db.select(safeColumns).from(users).where(and(eq(users.id, id), isNull(users.deletedAt))).limit(1)
  return user ?? null
}

/** Indica si el usuario usa credentials (tiene passwordHash) o solo OAuth. */
export async function userHasPassword(id: string): Promise<boolean> {
  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, id)).limit(1)
  return Boolean(row?.passwordHash)
}

export async function createCredentialsUser(data: {
  name: string
  email: string
  passwordHash: string
}): Promise<SafeUser | null> {
  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
    })
    .onConflictDoNothing({ target: users.email })
    .returning(safeColumns)
  return user ?? null
}

export async function updateUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId))
}

export async function updateUserName(userId: string, name: string): Promise<void> {
  await db.update(users).set({ name }).where(eq(users.id, userId))
}

/** Hash actual del usuario, para validar el cambio de contraseña (timing-safe). */
export async function getUserPasswordHash(userId: string): Promise<string | null> {
  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1)
  return row?.passwordHash ?? null
}
