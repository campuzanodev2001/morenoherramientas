import type { Session } from 'next-auth'
import { auth } from './index'
import { AuthError, AuthorizationError } from '@/lib/errors'
import type { Role } from '@/lib/db/types'

export async function getServerSession(): Promise<Session | null> {
  return auth()
}

/** Devuelve la sesión o lanza AuthError (401) si no hay. */
export async function requireAuth(): Promise<Session> {
  const session = await auth()
  if (!session?.user) throw new AuthError()
  return session
}

/** Exige un rol específico o lanza AuthorizationError (403). */
export async function requireRole(role: Role): Promise<Session> {
  const session = await requireAuth()
  if (session.user.role !== role) throw new AuthorizationError()
  return session
}

/** Verifica que el usuario actual es dueño del recurso o lanza 403. */
export async function isOwner(resourceUserId: string): Promise<Session> {
  const session = await requireAuth()
  if (session.user.id !== resourceUserId) throw new AuthorizationError()
  return session
}
